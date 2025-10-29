import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import Team from '@/models/Team' //
import HouseLeaderboard from '@/models/HouseLeaderboard' //

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB() //
  } catch (e) {
    console.warn('leaderboard GET: DB not available during build, returning empty data')
    // Return empty arrays in case of DB connection error during build
    return NextResponse.json({ teamScores: [], houseScores: [] })
  }

  // Fetch teams sorted by totalPoints (descending) directly from the database
  // *** FIX: Changed sort key from { score: -1 } to { totalPoints: -1 } ***
  const teamScores = await Team.find().sort({ totalPoints: -1 }).lean(); // Use .lean() for plain JS objects

  // Fetch house scores sorted by quaffles (descending)
  const houseScores = await HouseLeaderboard.find().sort({ quaffles: -1 }).lean(); // Use .lean()

  // Return the fetched and sorted data
  return NextResponse.json({ teamScores, houseScores })
} 