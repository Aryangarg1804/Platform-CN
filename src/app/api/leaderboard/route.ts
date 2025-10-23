import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import TeamLeaderboard from '@/models/TeamLeaderboard'
import HouseLeaderboard from '@/models/HouseLeaderboard'

export async function GET() {
  try {
    await connectDB()
  } catch (e) {
    console.warn('leaderboard GET: DB not available during build, returning empty data')
    return NextResponse.json({ teamScores: [], houseScores: [] })
  }

  const teamScores = await TeamLeaderboard.find().sort({ score: -1 })
  const houseScores = await HouseLeaderboard.find().sort({ totalScore: -1 })

  return NextResponse.json({ teamScores, houseScores })
}
