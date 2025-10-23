import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import TeamLeaderboard from '@/models/TeamLeaderboard'
import HouseLeaderboard from '@/models/HouseLeaderboard'

export async function GET() {
  await connectDB()

  const teamScores = await TeamLeaderboard.find().sort({ score: -1 })
  const houseScores = await HouseLeaderboard.find().sort({ totalScore: -1 })

  return NextResponse.json({ teamScores, houseScores })
}
