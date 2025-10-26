import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import Team from '@/models/Team'
import { Types } from 'mongoose'

// -------------------- POST --------------------
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const data = await req.json();
    const teamsArray = Array.isArray(data.teams) ? data.teams : data;

    console.log("🟡 Incoming teams:", teamsArray);

    if (!Array.isArray(teamsArray)) {
      return NextResponse.json({ error: "Expected array of teams" }, { status: 400 });
    }

    for (const team of teamsArray) {
      await Team.findOneAndUpdate(
        { name: team.name }, // simpler and safe filter
        {
          $set: {
            name: team.name,
            house: team.house,
            roundsParticipating: team.roundsParticipating || [1, 2, 3, 4],
            isActive: team.isActive !== false,
            totalPoints: team.score ?? team.totalPoints ?? 0,
          },
        },
        { upsert: true, new: true }
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
    await connectDB()
    const searchParams = new URL(req.url).searchParams
    const round = searchParams.get('round')
    const house = searchParams.get('house')

    let query: any = {}
    if (round) query.roundsParticipating = Number(round)
    if (house) query.house = house

    const teams = await Team.find(query)
      .sort({ isActive: -1, house: 1, name: 1 })
      .exec()

    return NextResponse.json(teams)
  } catch (err) {
    console.error('GET /api/admin/teams error:', err)
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}

// -------------------- DELETE --------------------
export async function DELETE(req: NextRequest) {
  try {
    await connectDB()

    const data = await req.json()
    const { teamId } = data

    if (!teamId) {
      return NextResponse.json({ error: 'Missing teamId' }, { status: 400 })
    }

    const result = await Team.findByIdAndUpdate(teamId, { isActive: false })
    if (!result) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/teams error:', err)
    if ((err as Error).name === 'CastError') {
      return NextResponse.json({ error: 'Invalid teamId format' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}
