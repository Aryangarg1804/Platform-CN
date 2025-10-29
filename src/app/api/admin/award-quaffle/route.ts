import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import HouseLeaderboard from '@/models/HouseLeaderboard'
import Round from '@/models/Round' // <<< ADDED: Import Round model
import Log from '@/models/Log'
import { getUserFromHeader, canAccessRound, getRoundNumber } from '@/lib/roundHeadAuth'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const user = getUserFromHeader(req.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await req.json()
    const { house, round } = data
    if (!house || !round) return NextResponse.json({ error: 'house and round required' }, { status: 400 })

    const rn = getRoundNumber(round)
    if (!canAccessRound(user, rn)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 1. Increment Quaffles for the overall House Leaderboard (Original logic)
    const hb = await HouseLeaderboard.findOneAndUpdate({ house }, { $inc: { quaffles: 1 } }, { new: true, upsert: true })
    
    // 2. IMPORTANT: Update the specific Round document to track the winner for public display
    // This makes the winner available to the public/round-N pages.
    await Round.findOneAndUpdate({ name: round }, { quaffleWinnerHouse: house }, { upsert: true }); // <<< NEW LOGIC

    // 3. Create a Log entry
    try {
      const msg = `${user.email} awarded a quaffle to ${house} for ${round}`
      await new Log({ message: msg, senderEmail: user.email, round, meta: { house } }).save()
    } catch (e) {
      console.error('Failed to create log for award-quaffle', e)
    }

    return NextResponse.json({ success: true, house: hb })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to award quaffle' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Use POST to award' }, { status: 405 })
}
