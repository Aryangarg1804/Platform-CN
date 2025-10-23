import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import RoundStatus from '@/models/RoundStatus'

// GET round status
// GET round status
export async function GET(req: Request) {
  try {
    await connectDB()
    const url = new URL(req.url)
    const round = url.searchParams.get('round') || 'round-1'

    const status = await RoundStatus.findOne({ round })
    return NextResponse.json({ round, isLocked: status ? status.isLocked : true })
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
