import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import Team from '@/models/Team'
import HouseLeaderboard from '@/models/HouseLeaderboard'
import { getUserFromHeader } from '@/lib/roundHeadAuth'

// Helper to shuffle array
function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const user = getUserFromHeader(req.headers.get('authorization'))
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const { round } = data
    if (!round) return NextResponse.json({ error: 'round required' }, { status: 400 })

    // Start special logic when round-5 is started
    if (round === 'round-5') {
      // Add Slytherin house to existing teams: teams without house Slytherin remain; we will allow Slytherin teams to be added via admin separately

      // Fetch active teams
      const activeTeams = await Team.find({ isActive: true, isEliminated: { $ne: true } }).exec()

      // Determine elimination count: drop to 16 teams for knockout (as described)
      const target = 16
      if (activeTeams.length <= target) {
        // Nothing to eliminate, but ensure roundsParticipating is set correctly
        await Team.updateMany({ isActive: true }, { $addToSet: { roundsParticipating: 5 } }).exec()
        return NextResponse.json({ success: true, message: 'Round-5 started, teams marked for round-5' })
      }

      // Sort by totalPoints ascending to eliminate lowest scoring teams
      const sorted = activeTeams.sort((a: any, b: any) => (a.totalPoints || 0) - (b.totalPoints || 0))
      const toEliminate = sorted.slice(0, sorted.length - target)
      const survivors = sorted.slice(sorted.length - target)

      // Mark eliminated teams
      const elimIds = toEliminate.map((t: any) => t._id)
      await Team.updateMany({ _id: { $in: elimIds } }, { isActive: false, isEliminated: true }).exec()

      // Shuffle survivors and ensure they have round-5 participation
      const shuffled = shuffle(survivors)
      const survivorIds = shuffled.map((s: any) => s._id)
      await Team.updateMany({ _id: { $in: survivorIds } }, { $addToSet: { roundsParticipating: 5 } }).exec()

      // Initialize house leaderboard entries for Slytherin if missing
      const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin']
      for (const h of houses) {
        await HouseLeaderboard.findOneAndUpdate({ house: h }, { $setOnInsert: { house: h, totalScore: 0, quaffles: 0 } }, { upsert: true })
      }

      return NextResponse.json({ success: true, eliminated: elimIds.length, survivors: survivorIds.length })
    }

    // Generic start for other rounds: just mark round participation
    const roundNumberMatch = round.match(/round-(\d+)/)
    const rn = roundNumberMatch ? Number(roundNumberMatch[1]) : null
    if (rn) {
      await Team.updateMany({ isActive: true }, { $addToSet: { roundsParticipating: rn } }).exec()
      return NextResponse.json({ success: true, message: `Round ${rn} started` })
    }

    return NextResponse.json({ error: 'Unsupported round' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to start round' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ error: 'Use POST to start a round' }, { status: 405 })
}
