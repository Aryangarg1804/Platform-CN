// import { NextRequest, NextResponse } from "next/server";
// import { connectDB } from "@/lib/mongoose";
// import Team from "@/models/Team";
// import { Types } from "mongoose";

// // -------------------- POST --------------------
// // -------------------- POST --------------------
// export async function POST(req: NextRequest) {
//   try {
//     await connectDB();

//     const data = await req.json();
//     const teamsArray = Array.isArray(data.teams) ? data.teams : data;

//     console.log("🟡 Incoming teams:", teamsArray);

//     if (!Array.isArray(teamsArray)) {
//       return NextResponse.json(
//         { error: "Expected array of teams" },
//         { status: 400 }
//       );
//     }

//     for (const team of teamsArray) {
//       const existingTeam = await Team.findOne({ name: team.name });

//       const currentPoints = existingTeam?.totalPoints || 0;
//       const addedScore = team.score ?? 0;

//       await Team.findOneAndUpdate(
//         { name: team.name },
//         {
//           $set: {
//             name: team.name,
//             house: team.house,
//             roundsParticipating: team.roundsParticipating || [1, 2, 3, 4],
//             isActive: team.isActive !== false,
//           },
//           $inc: {
//             totalPoints: team.score ?? 0, // ✅ Add score to total points
//           },
//         },
//         { upsert: true, new: true }
//       );
//     }

//     const allTeams = await Team.find({});
//     return NextResponse.json({ success: true, teams: allTeams });
//   } catch (err) {
//     console.error("❌ POST /api/admin/teams error details:", err);
//     return NextResponse.json({ error: String(err) }, { status: 500 });
//   }
// }

// // -------------------- GET --------------------
// export async function GET(req: NextRequest) {
//   try {
//     await connectDB();
//     const searchParams = new URL(req.url).searchParams;
//     const round = searchParams.get("round");
//     const house = searchParams.get("house");

//     let query: any = {};
//     if (round) query.roundsParticipating = Number(round);
//     if (house) query.house = house;

//     const teams = await Team.find(query)
//       .sort({ isActive: -1, house: 1, name: 1 })
//       .exec();

//     return NextResponse.json(teams);
//   } catch (err) {
//     console.error("GET /api/admin/teams error:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch teams" },
//       { status: 500 }
//     );
//   }
// }

// // -------------------- DELETE --------------------
// export async function DELETE(req: NextRequest) {
//   try {
//     await connectDB();

//     const data = await req.json();
//     const { teamId } = data;

//     if (!teamId) {
//       return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
//     }

//     const result = await Team.findByIdAndUpdate(teamId, { isActive: false });
//     if (!result) {
//       return NextResponse.json({ error: "Team not found" }, { status: 404 });
//     }

//     return NextResponse.json({ success: true });
//   } catch (err) {
//     console.error("DELETE /api/admin/teams error:", err);
//     if ((err as Error).name === "CastError") {
//       return NextResponse.json(
//         { error: "Invalid teamId format" },
//         { status: 400 }
//       );
//     }
//     return NextResponse.json(
//       { error: "Failed to delete team" },
//       { status: 500 }
//     );
//   }
// }




import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Team from "@/models/Team";
import { Types } from "mongoose";

// -------------------- POST --------------------
// Handles both:
// 1. Updating existing teams by _id (for name/house changes from R1).
// 2. Upserting new teams by name (for adding a new team).
// 3. Incrementing score (for later rounds, e.g., R2, R3, etc.)
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const data = await req.json();
    // Normalize data: client sends array of objects, either as `data` or `data.teams`
    const teamsArray = Array.isArray(data.teams) ? data.teams : data;

    if (!Array.isArray(teamsArray)) {
      return NextResponse.json(
        { error: "Expected array of teams" },
        { status: 400 }
      );
    }

    for (const team of teamsArray) {
      if (!team.name || !team.house) continue; // Skip invalid entries

      // 1. Determine the filter and upsert strategy.
      // Use _id for filtering if present (for updates to existing teams).
      // Otherwise, use name for upserting (for new teams).
      const filter: any = team._id 
        ? { _id: team._id } 
        : { name: team.name };
      
      const isUpsert = !team._id; 
      let options: any = { new: true }; // Always return new document

      // If we are upserting (creating new), enable the upsert option
      if (isUpsert) {
          options.upsert = true;
      }
      
      // 2. Prepare the update fields (for $set)
      const setFields: any = {
          name: team.name,
          house: team.house,
          // Ensure roundsParticipating is saved if provided, otherwise the schema default is used.
          roundsParticipating: team.roundsParticipating || [1, 2, 3, 4],
          isActive: team.isActive !== false,
      };

      // 3. Prepare the final update object ($set, $inc, $setOnInsert)
      const updateObject: any = {
          $set: setFields
      };

      // 4. Handle score update ($inc) for later rounds.
      // Only use $inc if score is explicitly greater than 0.
      if (typeof team.score === 'number' && team.score > 0) {
          updateObject.$inc = { totalPoints: team.score };
      } 
      
      // 5. Use $setOnInsert to ensure fields are correctly initialized only on creation.
      if (isUpsert) {
         updateObject.$setOnInsert = {
            totalPoints: 0,
            score: 0,
            isEliminated: false,
         }
      }

      await Team.findOneAndUpdate(
        filter,
        updateObject,
        options
      );
    }

    const allTeams = await Team.find({});
    return NextResponse.json({ success: true, teams: allTeams });
  } catch (err) {
    console.error("❌ POST /api/admin/teams error details:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// -------------------- GET --------------------
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const searchParams = new URL(req.url).searchParams;
    const round = searchParams.get("round");
    const house = searchParams.get("house");

    let query: any = {};
    if (round) query.roundsParticipating = Number(round);
    if (house) query.house = house;

    const teams = await Team.find(query)
      .sort({ isActive: -1, house: 1, name: 1 })
      .exec();

    return NextResponse.json(teams);
  } catch (err) {
    console.error("GET /api/admin/teams error:", err);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

// -------------------- DELETE --------------------
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const data = await req.json();
    const { teamId } = data;

    if (!teamId) {
      return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
    }

    const result = await Team.findByIdAndUpdate(teamId, { isActive: false });
    if (!result) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/teams error:", err);
    if ((err as Error).name === "CastError") {
      return NextResponse.json(
        { error: "Invalid teamId format" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}