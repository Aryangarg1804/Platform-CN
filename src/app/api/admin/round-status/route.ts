// import { NextResponse } from 'next/server'
// import { connectDB } from '@/lib/mongoose'
// import RoundStatus from '@/models/RoundStatus'

// // GET round status
// // GET round status
// export async function GET(req: Request) {
//   try {
//     await connectDB()
//     const url = new URL(req.url)
//     const round = url.searchParams.get('round') || 'round-1'

//     const status = await RoundStatus.findOne({ round })
//     return NextResponse.json({ round, isLocked: status ? status.isLocked : true })
//   } catch (err) {
//     console.error(err)
//     return NextResponse.json({ error: 'Failed to fetch round status' }, { status: 500 })
//   }
// }


// // POST to update lock/unlock
// export async function POST(req: Request) {
//   try {
//     await connectDB()
//     const data = await req.json()
//     const { round = 'round-1', isLocked } = data
//     const status = await RoundStatus.findOneAndUpdate(
//       { round },
//       { isLocked },
//       { upsert: true, new: true }
//     )
//     return NextResponse.json({ round: status.round, isLocked: status.isLocked })
//   } catch (err) {
//     console.error(err)
//     return NextResponse.json({ error: 'Failed to update round status' }, { status: 500 })
//   }
// }



import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import RoundStatus from '@/models/RoundStatus'

// GET round status
export async function GET(req: Request) {
  try {
    await connectDB()
    const url = new URL(req.url)
    const round = url.searchParams.get('round') // Check if a specific round is requested

    if (round) {
        // If a specific round is requested (e.g., for round-head dashboard)
        const status = await RoundStatus.findOne({ round })
        return NextResponse.json({ round, isLocked: status ? status.isLocked : true })
    }

    // If no specific round is requested (e.g., for public list)
    const allStatuses = await RoundStatus.find({})
    
    // Convert status documents to a simple array of unlocked round numbers (e.g., [1, 2, 3])
    const unlockedRounds = allStatuses
        .filter(s => s.isLocked === false)
        .map(s => {
            const match = s.round.match(/round-(\d+)/)
            return match ? Number(match[1]) : null
        })
        .filter((id): id is number => id !== null)

    return NextResponse.json({ allStatuses, unlockedRounds })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch round status' }, { status: 500 })
  }
}


// POST to update lock/unlock
export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()
    const { round = 'round-1', isLocked } = data
    const status = await RoundStatus.findOneAndUpdate(
      { round },
      { isLocked },
      { upsert: true, new: true }
    )
    return NextResponse.json({ round: status.round, isLocked: status.isLocked })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update round status' }, { status: 500 })
  }
}
