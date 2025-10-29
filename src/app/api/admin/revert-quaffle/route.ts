// src/app/api/admin/revert-quaffle/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import HouseLeaderboard from '@/models/HouseLeaderboard'
import Round from '@/models/Round' 
import { getUserFromHeader, canAccessRound, getRoundNumber } from '@/lib/roundHeadAuth'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    
    // 1. Authorization Check (Admin or Round Head)
    const user = getUserFromHeader(req.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await req.json()
    const { house, round } = data
    if (!house || !round) return NextResponse.json({ error: 'house and round required' }, { status: 400 })

    const rn = getRoundNumber(round)
    if (!canAccessRound(user, rn)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Decrement Quaffles for the overall House Leaderboard
    const hb = await HouseLeaderboard.findOneAndUpdate(
        { house }, 
        { $inc: { quaffles: -1 } }, 
        { new: true }
    )
    
    // 3. Clear the Quaffle winner for the specific Round document
    await Round.findOneAndUpdate(
        { name: round }, 
        { $set: { quaffleWinnerHouse: null } }
    ); 

    return NextResponse.json({ success: true, message: `Quaffle reverted from ${house} for ${round}.` })
  } catch (err) {
    console.error(`POST /api/admin/revert-quaffle error:`, err)
    return NextResponse.json({ error: 'Failed to revert quaffle' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Use POST for quaffle reversion' }, { status: 405 })
}