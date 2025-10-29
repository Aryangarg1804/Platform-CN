// src/app/api/rounds/[roundId]/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import Round, { IRoundResultPair, IRoundResult, IRound } from '@/models/Round'
import Team, { ITeam } from '@/models/Team'
import Potion from '@/models/Potion' // Import Potion
import { getUserFromHeader } from '@/lib/roundHeadAuth'
import mongoose, { Types } from 'mongoose'

// --- Interface Definitions for Populated Data ---
interface PopulatedRoundResultPair {
    teams: Array<Pick<ITeam, '_id'|'name' | 'house'> | null>;
    potionCreatedId?: { _id: Types.ObjectId, name: string } | null; // Populated Potion
    points: number;
    time: number;
}
interface PopulatedRoundResultSingle {
     team: Pick<ITeam, '_id'|'name' | 'house' | 'totalPoints'> | null | undefined;
     points: number;
     time: number;
     rank: number;
}
interface PopulatedRound {
    _id: Types.ObjectId;
    roundNumber: number;
    name: string;
    results: (PopulatedRoundResultPair | PopulatedRoundResultSingle)[]; // Array of mixed types
    isLocked: boolean;
    quaffleWinnerHouse?: string;
    createdAt: Date;
    updatedAt: Date;
}

// --- GET Request (Read Round Results - Modified for Pairs in Round 2) ---
export async function GET(
    req: NextRequest, 
    { params }: { params: { roundId: string } }
) {
    const roundId = params.roundId;

    try {
        await connectDB();
        let query = Round.findOne({ name: roundId });

        // Specific population for round-2 (Pairs)
        if (roundId === 'round-2') {
            query = query.populate([
                {
                    path: 'results.teams', // Populate the array of team IDs
                    model: Team,
                    select: 'name house'
                },
                {
                    path: 'results.potionCreatedId', // Populate the potion ID
                    model: Potion, // Use the imported Potion model
                    select: 'name' // Select only the potion name
                }
            ]);
        } else {
            // Population logic for other rounds (single team)
            query = query.populate({
                path: 'results.team',
                model: Team,
                select: 'name house totalPoints'
            });
        }

        const roundData = await query.lean<PopulatedRound>().exec();

        if (!roundData) {
            return NextResponse.json({ success: true, round: { name: roundId, results: [] } });
        }

        // --- Data cleaning/transformation after population ---
        let cleanedResults: any[] = [];

        if (roundId === 'round-2') {
             // Handle pair results
             cleanedResults = (roundData.results as PopulatedRoundResultPair[])
                .map(result => ({
                    ...result,
                    teams: Array.isArray(result.teams) ? result.teams.slice(0, 2) : [null, null],
                    // Rename populated potion field for clarity
                    potionCreated: result.potionCreatedId ? (result.potionCreatedId as any) : null,
                }))
                .filter(result => result.teams.every(t => t && t.name)); // Filter out results with missing teams
             cleanedResults.sort((a, b) => b.points - a.points); // Sort pairs by points
        } else {
             // Handle single team results
             cleanedResults = (roundData.results as PopulatedRoundResultSingle[])
                .filter(result => !!(result.team && result.team.name));
             cleanedResults.sort((a, b) => (a.rank || 999) - (b.rank || 999)); // Sort others by rank
        }

        return NextResponse.json({ 
            success: true, 
            round: {
                ...roundData,
                results: cleanedResults, // Send cleaned results
                name: roundId,
            } 
        });
    } catch (err) {
        console.error(`GET /api/rounds/${roundId} error:`, err);
        return NextResponse.json({ success: false, error: `Failed to fetch results for ${roundId}` }, { status: 500 });
    }
}

// --- POST Request (Block Round 2, allow others) ---
export async function POST(
    req: NextRequest, 
    { params }: { params: { roundId: string } }
) {
     const roundId = params.roundId;

     if (roundId === 'round-2') {
         return NextResponse.json({ success: false, error: 'Use /api/admin/round-2/submit-pair for Round 2 submissions.' }, { status: 405 });
     }

    // --- Keep existing POST logic for OTHER rounds (e.g., Round 1, 3, 4, 5, 6, 7) ---
    try {
        await connectDB();
        const user = getUserFromHeader(req.headers.get('authorization'));
        if (!user || (user.role !== 'admin' && !(user.role === 'round-head' /* && user.roundAssigned === roundNumber */))) { // More complex check needed if non-admin R-Heads use this
            return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
        }
        const { results, approved } = await req.json();
        if (!Array.isArray(results)) { return NextResponse.json({ success: false, error: 'Invalid results format.' }, { status: 400 }); }

        // Standard single-team result formatting
        const formattedResults = results.map(r => ({
            team: new mongoose.Types.ObjectId(r.team),
            points: Number(r.points) || 0,
            time: Number(r.time) || 0,
            rank: Number(r.rank) || 0,
        }));

        const update = {
            name: roundId,
            roundNumber: Number(roundId.split('-')[1]) || 0,
            results: formattedResults,
            ...(approved !== undefined && { isLocked: approved })
        };
        const round = await Round.findOneAndUpdate({ name: roundId }, { $set: update }, { upsert: true, new: true });
        return NextResponse.json({ success: true, message: `Round ${roundId} results saved.`, round });
    } catch (err: any) {
        console.error(`POST /api/rounds/${roundId} error:`, err);
        return NextResponse.json({ success: false, error: `Failed to save ${roundId} results.` }, { status: 500 });
    }
}
