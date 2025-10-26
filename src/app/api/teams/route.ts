// import { NextResponse } from 'next/server'
// import { connectDB } from '@/lib/mongoose'
// import Team from '@/models/Teams'
// import { verifyToken } from '@/lib/auth'

// // GET all teams
// export async function GET() {
//   try {
//     await connectDB()
//     const teams = await Team.find().sort({ house: 1, name: 1 })
//     return NextResponse.json({ success: true, teams })
//   } catch (err) {
//     console.error('GET /teams error:', err)
//     return NextResponse.json({ success: false, error: 'Failed to fetch teams' }, { status: 500 })
//   }
// }

// // POST create or update multiple teams
// export async function POST(req: Request) {
//   try {
//     await connectDB()

//     // Authorization: only admin can create/update teams
//     const authHeader = req.headers.get('authorization')
//     const token = authHeader?.split(' ')[1]
//     const user = verifyToken(token)
//     if (!user || (user as any).role !== 'admin') {
//       return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
//     }

//     // Parse JSON safely
//     let data
//     try {
//       data = await req.json()
//     } catch (parseErr) {
//       console.error('JSON parse error:', parseErr)
//       return NextResponse.json(
//         { success: false, error: 'Invalid JSON' },
//         { status: 400 }
//       )
//     }

//     if (!Array.isArray(data)) {
//       return NextResponse.json(
//         { success: false, error: 'Expected an array of teams' },
//         { status: 400 }
//       )
//     }

//     const results = []

//     for (const teamData of data) {
//       const { name, house, score } = teamData
//       if (!name || !house) continue // skip invalid entries

//       const team = await Team.findOneAndUpdate(
//         { name },
//         { name, house, score: Number(score) || 0 },
//         { upsert: true, new: true }
//       )
//       results.push(team)
//     }

//     // return the saved teams (with DB _id) so client can use real ids
//     return NextResponse.json({ success: true, teams: results })
//   } catch (err) {
//     console.error('POST /teams error:', err)
//     return NextResponse.json(
//       { success: false, error: 'Failed to save teams' },
//       { status: 500 }
//     )
//   }
// }





import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
// Corrected import: Use Team model from models/Team.ts
import Team from '@/models/Team' // Changed from '@/models/Teams'
import { verifyToken } from '@/lib/auth'

// GET all teams
export async function GET() {
  try {
    await connectDB()
    // Using the correct Team model
    const teams = await Team.find().sort({ house: 1, name: 1 })
    return NextResponse.json({ success: true, teams })
  } catch (err) {
    console.error('GET /teams error:', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch teams' }, { status: 500 })
  }
}

// POST create or update multiple teams
export async function POST(req: Request) {
  try {
    await connectDB()

    // Authorization: only admin can create/update teams
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    const user = verifyToken(token)
    if (!user || (user as any).role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Parse JSON safely
    let data
    try {
      data = await req.json()
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr)
      return NextResponse.json(
        { success: false, error: 'Invalid JSON' },
        { status: 400 }
      )
    }

    // The frontend sends an array directly now
    // if (!Array.isArray(data.teams)) { // Check data directly
    // Updated check: Expect an array directly
     if (!Array.isArray(data)) {
      return NextResponse.json(
        { success: false, error: 'Expected an array of teams' },
        { status: 400 }
      )
    }

    const results = []

    // Iterate over the data array directly
    // for (const teamData of data.teams) {
    for (const teamData of data) {
      // Destructure _id as well, if present (for updates)
      const { _id, name, house, score } = teamData
      if (!name || !house) continue // skip invalid entries

      // Use _id for filtering if it exists, otherwise use name (for upsert)
      const filter = _id ? { _id } : { name };

      const team = await Team.findOneAndUpdate(
        filter, // Use the determined filter
        // --- THIS IS THE FIX ---
        // Map the incoming 'score' field to the database's 'totalPoints' field.
        { name, house, totalPoints: Number(score) || 0 }, // Map score to totalPoints
        { upsert: true, new: true }
      )
      results.push(team)
    }

    // return the saved teams (with DB _id) so client can use real ids
    return NextResponse.json({ success: true, teams: results })
  } catch (err) {
    console.error('POST /teams error:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to save teams' },
      { status: 500 }
    )
  }
}
