import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import Team from '@/models/Team'
import { getUserFromHeader } from '@/lib/roundHeadAuth'
import { Types } from 'mongoose'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    
    const user = getUserFromHeader(req.headers.get('authorization'))
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const { teams } = data
    // Bulk create/update teams
    const operations = teams.map((team: any) => ({
      updateOne: {
        filter: { _id: team._id || new Types.ObjectId() },
        update: {
          $set: {
            name: team.name,
            house: team.house,
            roundsParticipating: team.roundsParticipating || [1,2,3,4],
            isActive: team.isActive !== false,
            totalScore: team.totalScore || 0
          }
        },
        upsert: true
      }
    }))
    

    await Team.bulkWrite(operations)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update teams' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const searchParams = new URL(req.url).searchParams
    const round = searchParams.get('round')
    const house = searchParams.get('house')

    let query: any = {}
    
    // Filter by round participation if specified
    if (round) {
      query.roundsParticipating = Number(round)
    }

    // Filter by house if specified
    if (house) {
      query.house = house
    }

    // Always show active teams first
    const teams = await Team.find(query)
      .sort({ isActive: -1, house: 1, name: 1 })
      .exec()

    return NextResponse.json(teams)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB()
    
    const user = getUserFromHeader(req.headers.get('authorization'))
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const { teamId } = data

    // Soft delete by setting isActive to false
    await Team.findByIdAndUpdate(teamId, { isActive: false })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}