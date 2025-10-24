import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import Team from '@/models/Team' 

export async function GET() {
  try {
    await connectDB()
  } catch (e) {
    console.warn('leaderboard GET: DB not available during build, returning empty data')
    return NextResponse.json({ teamScores: [] })
  }
  const teamScores = await Team.find().sort({ score: -1 })
  return NextResponse.json({ teamScores })
}
