// src/app/api/admin/teams/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Team from "@/models/Team"; // Import ITeam interface
import Potion from "@/models/Potion";
import Log from '@/models/Log';
import { Types } from "mongoose";

// --- POST Handler (Handles Updates including Score Increment and Potion Assignment) ---
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    // TODO: Add robust admin authorization check here using getUserFromHeader if needed

    const data = await req.json();
    const teamsArray = Array.isArray(data) ? data : [data];

    console.log("🟡 Incoming teams update:", teamsArray);

    if (!Array.isArray(teamsArray) || teamsArray.length === 0) {
      return NextResponse.json( { error: "Expected an array of teams or a single team object" }, { status: 400 } );
    }

    const updatedTeamIds = [];
    const potionCountAdjustments: { [potionId: string]: number } = {};

    for (const teamUpdate of teamsArray) {
  // 🟢 If team has no _id → create a new one instead of skipping
  if (!teamUpdate._id) {
      console.log("🆕 Creating new team:", teamUpdate);
      const newTeam = new Team({
        name: teamUpdate.name,
        house: teamUpdate.house,
        totalPoints: teamUpdate.totalPoints || 0,
        score: teamUpdate.score || 0,
        roundsParticipating: teamUpdate.roundsParticipating || [1, 2, 3, 4],
        isActive: teamUpdate.isActive ?? true,
        isEliminated: teamUpdate.isEliminated ?? false,
        potionCreatedRound2: teamUpdate.potionCreatedRound2 || null
      });

      const savedTeam = await newTeam.save();
      updatedTeamIds.push(savedTeam._id);
      console.log("✅ New team saved:", savedTeam.name);
      continue;
  }

      // Ensure teamId is a valid ObjectId before proceeding
      let teamId: Types.ObjectId;
      try {
          teamId = new Types.ObjectId(teamUpdate._id);
      } catch (e) {
          console.warn(`Skipping team update: Invalid _id format "${teamUpdate._id}".`);
          continue;
      }


      // --- Prepare update operations ---
      const updateOps: any = { $set: {}, $inc: {} };
      let newPotionIdStr: string | null | undefined = undefined; // Use undefined to track if it was in payload

      // Fields to potentially set ($set)
      if (teamUpdate.name !== undefined) updateOps.$set.name = teamUpdate.name;
      if (teamUpdate.house !== undefined) updateOps.$set.house = teamUpdate.house;
      if (teamUpdate.isActive !== undefined) updateOps.$set.isActive = teamUpdate.isActive;
      if (teamUpdate.isEliminated !== undefined) updateOps.$set.isEliminated = teamUpdate.isEliminated;

      // Special handling for potionCreatedRound2
      if (teamUpdate.potionCreatedRound2 !== undefined) {
         if (teamUpdate.potionCreatedRound2 === null || teamUpdate.potionCreatedRound2 === "") {
             updateOps.$set.potionCreatedRound2 = null;
             newPotionIdStr = null;
         } else {
             try {
                const potionObjectId = new Types.ObjectId(teamUpdate.potionCreatedRound2);
                updateOps.$set.potionCreatedRound2 = potionObjectId;
                newPotionIdStr = potionObjectId.toString();
             } catch (e) {
                console.error(`Invalid potionCreatedRound2 ObjectId "${teamUpdate.potionCreatedRound2}" for team ${teamId}. Skipping field.`);
             }
         }
      }

      // Field to increment ($inc) - use 'score' from payload for points added this round
      if (teamUpdate.score !== undefined && typeof teamUpdate.score === 'number' && teamUpdate.score !== 0) {
        updateOps.$inc.totalPoints = teamUpdate.score;
      }

      // --- Clean up empty update operators ---
      if (Object.keys(updateOps.$set).length === 0) delete updateOps.$set;
      if (Object.keys(updateOps.$inc).length === 0) delete updateOps.$inc;

      // --- Execute update only if there's something to change ---
      if (updateOps.$set || updateOps.$inc) {

         // --- Calculate Potion Count Adjustments (Fetch old state BEFORE update) ---
         if (newPotionIdStr !== undefined) { // Check if potion field was part of the update request
             // FIX: Explicitly type the result of lean()
             const oldTeam = await Team.findById(teamId, 'potionCreatedRound2')
                                       .lean<{ potionCreatedRound2?: Types.ObjectId | null }>();

             const oldPotionIdStr = oldTeam?.potionCreatedRound2?.toString() || null;

             // Decrement count for the old potion if it changed and wasn't null
             if (oldPotionIdStr && oldPotionIdStr !== newPotionIdStr) {
                 potionCountAdjustments[oldPotionIdStr] = (potionCountAdjustments[oldPotionIdStr] || 0) - 1;
             }
             // Increment count for the new potion if it changed and isn't null
             if (newPotionIdStr && newPotionIdStr !== oldPotionIdStr) {
                 potionCountAdjustments[newPotionIdStr] = (potionCountAdjustments[newPotionIdStr] || 0) + 1;
             }
         }

          // --- Perform the Team Update ---
          const updatedTeam = await Team.findByIdAndUpdate(teamId, updateOps, { new: true });
          if (updatedTeam) {
            updatedTeamIds.push(updatedTeam._id);
              // If points were added, create a log entry
              try {
                if (updateOps.$inc && typeof updateOps.$inc.totalPoints === 'number' && updateOps.$inc.totalPoints !== 0) {
                  const authHeader = (req as any).headers?.get?.('authorization')
                  let senderEmail = undefined
                  try {
                    const { getUserFromHeader } = await import('@/lib/roundHeadAuth')
                    const user = getUserFromHeader(authHeader)
                    senderEmail = user?.email
                  } catch (e) {}
                  const points = updateOps.$inc.totalPoints
                  const msg = `${senderEmail || 'unknown'} added ${points} points to team ${updatedTeam.name}`
                  await new Log({ message: msg, senderEmail, round: teamUpdate.round, points, meta: { teamId: updatedTeam._id } }).save()
                }
              } catch (e) { console.error('Failed to create log for team update', e) }
          } else {
              console.warn(`Team with _id ${teamId} not found during update.`);
          }
      } else {
          console.log(`No update operations for team ${teamId}. Skipping.`);
      }
    } // End loop through teamsArray

     // --- Update Potion Counts in DB using bulkWrite ---
     const potionBulkOps = Object.entries(potionCountAdjustments)
        .filter(([potionId, change]) => change !== 0)
        .map(([potionId, change]) => ({
            updateOne: {
                filter: { _id: new Types.ObjectId(potionId) },
                update: { $inc: { numberOfTimesCreated: change } }
            }
        }));

     if (potionBulkOps.length > 0) {
        try {
            const bulkResult = await Potion.bulkWrite(potionBulkOps);
            console.log("🧪 Potion count update result:", bulkResult);
        } catch(potionUpdateError) {
            console.error("❌ Error updating potion counts:", potionUpdateError);
            // Optionally return partial success or specific error here
        }
     }

    // Fetch and return all teams after updates for confirmation
    const allTeams = await Team.find({}).sort({ name: 1 });
    return NextResponse.json({ success: true, teams: allTeams });

  } catch (err: any) {
    console.error("❌ POST /api/admin/teams error:", err);
    if (err.name === 'ValidationError') {
        return NextResponse.json({ error: "Validation failed", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: `Server error: ${err.message}` }, { status: 500 });
  }
}

// --- GET Handler (Fetch teams, optionally filtered by round) ---
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const searchParams = new URL(req.url).searchParams;
    const roundParam = searchParams.get("round");
    const house = searchParams.get("house");

    let query: any = { isActive: true }; // Default to active teams
    if (roundParam) {
        const roundNumber = parseInt(roundParam, 10);
        if (!isNaN(roundNumber)) { query.roundsParticipating = roundNumber; }
        else { console.warn(`Invalid round parameter: ${roundParam}. Fetching all active teams.`); }
    }
    if (house) query.house = house;

    const teams = await Team.find(query).sort({ house: 1, name: 1 }).lean().exec();
    return NextResponse.json(teams); // Return the array directly

  } catch (err) {
    console.error("GET /api/admin/teams error:", err);
    return NextResponse.json( { error: "Failed to fetch teams" }, { status: 500 } );
  }
}

// --- DELETE Handler (Mark team as inactive) ---
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    // TODO: Add robust admin authorization check here
    const data = await req.json();
    const { teamId } = data;
    if (!teamId) return NextResponse.json({ error: "Missing teamId" }, { status: 400 });

    const result = await Team.findByIdAndUpdate(teamId, { isActive: false }, { new: true });
    if (!result) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    console.log(`Team ${teamId} marked as inactive.`);
    return NextResponse.json({ success: true, team: result });

  } catch (err: any) {
    console.error("DELETE /api/admin/teams error:", err);
    if (err.name === "CastError") { return NextResponse.json( { error: "Invalid teamId format" }, { status: 400 } ); }
    return NextResponse.json( { error: "Failed to mark team as inactive" }, { status: 500 } );
  }
}