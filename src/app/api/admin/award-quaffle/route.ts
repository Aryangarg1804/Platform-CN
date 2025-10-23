import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import HouseLeaderboard from '@/models/HouseLeaderboard'
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

    // increment quaffles for the house
    const hb = await HouseLeaderboard.findOneAndUpdate({ house }, { $inc: { quaffles: 1 } }, { new: true, upsert: true })

    return NextResponse.json({ success: true, house: hb })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to award quaffle' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Use POST to award' }, { status: 405 })
}
