// import { NextResponse } from 'next/server'
// import { connectDB } from '@/lib/mongoose'
// import Team from '@/models/Team'
// import Round from '@/models/Round'

// export async function GET() {
//   try {
//     await connectDB()
//   } catch (e) {
//     console.warn('public leaderboard GET: DB not available during build, returning empty teams')
//     return NextResponse.json({ teams: [] })
//   }

//   // fetch teams + their per-round points
//   const teams = await Team.find().lean()
//   const rounds = await Round.find({ roundNumber: { $in: [1,2,3,4] } }).lean()

//   // build per-team round points array
//   const teamMap = teams.map(t => {
//     const perRound = rounds.map(r => {
//       const res = r.results.find((rr: { team: { toString(): string }; points: number }) => rr.team.toString() === String(t._id))
//       return res ? res.points : 0
//     })
//     return { ...t, perRound, totalPoints: t.totalPoints || 0 }
//   })

//   // sort by totalPoints descending
//   teamMap.sort((a,b) => b.totalPoints - a.totalPoints)

//   return NextResponse.json({ teams: teamMap })
// }



import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import Team from '@/models/Team'
import Round from '@/models/Round'

export const dynamic = 'force-dynamic' // <-- Prevents build-time prerender crash

export async function GET() {
  try {
    await connectDB()
  } catch (e) {
    console.warn('public leaderboard GET: DB not available during build, returning empty teams')
    return NextResponse.json({ teams: [] })
  }

  // Fetch all teams and rounds
  const teams = await Team.find().lean()
  const rounds = await Round.find({ roundNumber: { $in: [1, 2, 3, 4] } }).lean()

  // Safely compute points per round
  const teamMap = teams.map((t) => {
    const perRound = rounds.map((r) => {
      const res = (r.results || []).find(
        (rr: any) => rr?.team?._id?.toString?.() === t?._id?.toString?.()
      )
      return res?.points || 0
    })

    return {
      _id: t?._id?.toString() || '',
      name: t?.name || '',
      house: t?.house || '',
      totalPoints: t?.totalPoints || 0,
      perRound,
    }
  })

  // Sort by total points descending
  teamMap.sort((a, b) => b.totalPoints - a.totalPoints)

  return NextResponse.json({ teams: teamMap })
}
