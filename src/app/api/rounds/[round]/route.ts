import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import Round from '@/models/Round'
import Team from '@/models/Team'
import HouseLeaderboard from '@/models/HouseLeaderboard'
import { verifyToken } from '@/lib/auth'

// POST: accept { results: [{ teamId, points, time, rank }], approved: boolean }
// Saves round results and recalculates team totalPoints
export async function POST(req: Request) {
  try {
    await connectDB()
    const url = new URL(req.url)
    const roundParam = url.pathname.split('/').pop() || 'round-1'

    const data = await req.json()
    const { results = [], approved = true } = data

    // simple auth: expect Authorization: Bearer <token>
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // only admin or the round-head assigned to this round can post
    const matchAuth = (user as any)
    const allowed = matchAuth.role === 'admin' || matchAuth.role === 'round-head' && matchAuth.roundAssigned === Number((roundParam.match(/round-(\d+)/) || [])[1] || 1)
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // derive roundNumber from 'round-1' pattern
    const match = (roundParam || '').match(/round-(\d+)/)
    const roundNumber = match ? Number(match[1]) : 1

    // upsert Round document
    const roundDoc = await Round.findOneAndUpdate(
      { roundNumber },
      { roundNumber, name: `Round ${roundNumber}`, results },
      { upsert: true, new: true }
    )

    // Recompute team totalPoints by summing all rounds for rounds 1..4 (or all available)
    const allRounds = await Round.find({}).lean()

    // Map teamId -> total points
    const totals: Record<string, number> = {}
    for (const r of allRounds) {
      for (const res of r.results || []) {
        const tid = String(res.team)
        totals[tid] = (totals[tid] || 0) + (Number(res.points) || 0)
      }
    }

    // Update Team.totalPoints for affected teams
    for (const [teamId, tot] of Object.entries(totals)) {
      await Team.findByIdAndUpdate(teamId, { totalPoints: tot }, { new: true })
    }

    // If approved, compute house totals for this round and award quaffle to winning house
    if (approved) {
      // gather per-house totals from this round results
      const houseTotals: Record<string, number> = {}
      for (const r of results) {
        // find team to get its house
        const t = await Team.findById(r.team)
        const house = t?.house || 'Unknown'
        houseTotals[house] = (houseTotals[house] || 0) + (Number(r.points) || 0)
      }

      // determine winning house (highest total)
      let winningHouse: string | null = null
      let best = -Infinity
      for (const [h, sum] of Object.entries(houseTotals)) {
        if (sum > best) {
          best = sum
          winningHouse = h
        }
      }

      if (winningHouse) {
        await HouseLeaderboard.findOneAndUpdate({ house: winningHouse }, { $inc: { quaffles: 1 } }, { upsert: true })
      }
    }

    return NextResponse.json({ success: true, round: roundDoc })
  } catch (err) {
    console.error('POST /api/rounds/[round] error:', err)
    return NextResponse.json({ success: false, error: 'Failed to save round results' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    await connectDB()
    const url = new URL(req.url)
    const roundParam = url.pathname.split('/').pop() || 'round-1'
    const match = (roundParam || '').match(/round-(\d+)/)
    const roundNumber = match ? Number(match[1]) : 1

    const roundDoc = await Round.findOne({ roundNumber }).lean()
    return NextResponse.json({ round: roundDoc || null })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Failed to fetch round' }, { status: 500 })
  }
}
