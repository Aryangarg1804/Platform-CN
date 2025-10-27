import { NextResponse, NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import Round, { IRoundResult, IRound } from '@/models/Round' 
import Team, { ITeam } from '@/models/Team' 
import { getUserFromHeader } from '@/lib/roundHeadAuth' 
import mongoose from 'mongoose' // Need this import for ObjectId casting

// --- Interface Definitions for Leaned/Populated Data ---
// NOTE: ITeam is assumed to be defined in src/models/Team.ts
interface LeanedRoundResult extends Omit<IRoundResult, 'team'> {
    team: Pick<ITeam, 'name' | 'house' | 'totalPoints'> | null | undefined; 
}

// NOTE: IRound is assumed to be defined in src/models/Round.ts
interface LeanedRound extends Omit<IRound, 'results'> {
    results: LeanedRoundResult[];
    quaffleWinnerHouse?: string; 
}


// --- GET Request (Read Round Results) ---
export async function GET(
    req: NextRequest, 
    { params }: { params: { roundId: string } }
) {
    const roundId = params.roundId;

    try {
        await connectDB()

        const roundData = await Round.findOne({ name: roundId })
            // Populate the team details
            .populate({
                path: 'results.team',
                model: Team,
                select: 'name house totalPoints'
            })
            .lean<LeanedRound>()
            .exec()

        if (!roundData) {
            return NextResponse.json({ success: true, round: { name: roundId, results: [] } })
        }

        const filteredResults = roundData.results.filter(
            (result): result is LeanedRoundResult => !!(result.team && result.team.name)
        );
        
        // Ensure the results are ranked correctly (descending score/points)
        filteredResults.sort((a, b) => b.points - a.points);


        return NextResponse.json({ 
            success: true, 
            round: {
                ...roundData,
                results: filteredResults,
                name: roundId,
            } 
        })

    } catch (err) {
        console.error(`GET /api/rounds/${roundId} error:`, err)
        return NextResponse.json({ success: false, error: `Failed to fetch results for ${roundId}` }, { status: 500 })
    }
}

// --- POST Request (Save Final Round Results and Lock Status) ---
export async function POST(
    req: NextRequest, 
    { params }: { params: { roundId: string } }
) {
    const roundId = params.roundId;

    try {
        await connectDB();
        
        // 1. Authorization Check 
        const user = getUserFromHeader(req.headers.get('authorization'));
        if (!user || (user.role !== 'admin' && user.role !== 'round-head')) {
            return NextResponse.json({ success: false, error: 'Forbidden. Must be Admin or Round Head.' }, { status: 403 });
        }

        const { results, approved } = await req.json();

        if (!Array.isArray(results)) {
            return NextResponse.json({ success: false, error: 'Invalid results format.' }, { status: 400 });
        }

        // 2. Format incoming team results (converting ID strings to Mongoose ObjectIds)
        const formattedResults = results.map(r => ({
            // Mongoose.Types.ObjectId(r.team) is the correct way to cast ID string to ObjectId
            team: new mongoose.Types.ObjectId(r.team), 
            points: Number(r.points) || 0,
            time: Number(r.time) || 0,
            rank: Number(r.rank) || 0,
        }));
        
        const update = {
            name: roundId,
            roundNumber: Number(roundId.split('-')[1]) || 0,
            results: formattedResults,
            // Only update isLocked if 'approved' flag is explicitly sent
            ...(approved !== undefined && { isLocked: approved }) 
        };

        // 3. Save results to the Round document
        const round = await Round.findOneAndUpdate(
            { name: roundId },
            { $set: update },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true, message: 'Round results finalized and saved.', round });

    } catch (err) {
        console.error(`POST /api/rounds/${roundId} error:`, err);
        return NextResponse.json({ success: false, error: 'Failed to save round results.' }, { status: 500 });
    }
}
