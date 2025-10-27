import { NextResponse, NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import Round, { IRoundResult, IRound } from '@/models/Round' // Assuming IRound and IRoundResult are in your models/Round.ts
import Team, { ITeam } from '@/models/Team' // Assuming ITeam is in your models/Team.ts

// Define the expected structure for the populated and leaned data
// We must mirror the structure of IRound but with 'team' populated and objects being plain (LeanedDocument)
interface LeanedRoundResult extends Omit<IRoundResult, 'team'> {
    // The populated team field, which comes back as a plain object
    team: Pick<ITeam, 'name' | 'house' | 'totalPoints'> | null | undefined; 
}

interface LeanedRound extends Omit<IRound, 'results'> {
    results: LeanedRoundResult[];
}


// GET request to fetch results for a specific round
// URL format: /api/rounds/round-1, /api/rounds/round-7, etc.
export async function GET(
    req: NextRequest, 
    { params }: { params: { roundId: string } }
) {
    const roundId = params.roundId; // e.g., 'round-1', 'round-7'

    try {
        await connectDB()

        const roundData = await Round.findOne({ name: roundId })
            // Populate the team details using the team ID stored in results.team
            .populate({
                path: 'results.team',
                model: Team,
                select: 'name house totalPoints' // Select the fields needed for the leaderboard
            })
            .lean<LeanedRound>() // Cast the lean result to our defined interface
            .exec()

        // Handle the case where the Round document is not found (still null)
        if (!roundData) {
            return NextResponse.json({ success: true, round: { name: roundId, results: [] } })
        }

        // We use a type predicate check (result.team && result.team.name) to filter out null/undefined results.
        // This is safe because 'results' is guaranteed to exist by the 'LeanedRound' type and the previous null check.
        const filteredResults = roundData.results.filter(
            (result): result is LeanedRoundResult => !!(result.team && result.team.name)
        );
        
        // Ensure the results are ranked correctly (descending score, if points is the primary field)
        filteredResults.sort((a, b) => b.points - a.points);


        return NextResponse.json({ 
            success: true, 
            round: {
                // We spread roundData, knowing it is a LeanedRound now
                ...roundData,
                results: filteredResults,
                // Ensure name is passed correctly as roundId
                name: roundId 
            } 
        })

    } catch (err) {
        console.error(`GET /api/rounds/${roundId} error:`, err)
        return NextResponse.json({ success: false, error: `Failed to fetch results for ${roundId}` }, { status: 500 })
    }
}

// POST is usually used by the admin/round-head dashboards to save results.
export async function POST(
    req: NextRequest, 
    { params }: { params: { roundId: string } }
) {
    const roundId = params.roundId;

    // A complete implementation would update the Round model in the database here.
    
    return NextResponse.json({ success: true, message: `POST received for ${roundId}` });
}
