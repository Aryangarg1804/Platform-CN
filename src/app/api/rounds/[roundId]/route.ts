import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import Round from '@/models/Round'
import { canAccessRound, getUserFromHeader, getRoundNumber } from '@/lib/roundHeadAuth'

// GET round details and scores
export async function GET(req: NextRequest, { params }: { params: { roundId: string } }) {
  try {
    await connectDB()
    const roundNumber = getRoundNumber(params.roundId)
    const round = await Round.findOne({ roundNumber }).populate('results.team')
    
    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }
    
    return NextResponse.json({ round })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch round data' }, { status: 500 })
  }
}

// POST to update round scores
export async function POST(req: NextRequest, { params }: { params: { roundId: string } }) {
  try {
    await connectDB()
    const roundNumber = getRoundNumber(params.roundId)
    const user = getUserFromHeader(req.headers.get('authorization'))

    if (!user || !canAccessRound(user, roundNumber)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const { results, approved } = data

    // Find or create round
    let round = await Round.findOne({ roundNumber })
    if (!round) {
      round = new Round({ 
        roundNumber,
        name: `Round ${roundNumber}`,
        results: [],
        isLocked: false 
      })
    }

    // Update results
    round.results = results
    
    // Only admin can approve/lock rounds
    if (user.role === 'admin' && approved !== undefined) {
      round.isLocked = approved
    }

    await round.save()
    return NextResponse.json({ success: true, round })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update round' }, { status: 500 })
  }
}