// import { NextRequest, NextResponse } from 'next/server'
// import { connectDB } from '@/lib/mongoose'
// import Team from '@/models/Teams'
// import { getUserFromHeader } from '@/lib/roundHeadAuth'
// import { Types } from 'mongoose'

// export async function POST(req: NextRequest) {
//   try {
//     await connectDB()
    
//     const user = getUserFromHeader(req.headers.get('authorization'))
//     if (!user || user.role !== 'admin') {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//     }

//     const data = await req.json()
//     const { teams } = data
//     // Bulk create/update teams
//     const operations = teams.map((team: any) => ({
//       updateOne: {
//         filter: { _id: team._id || new Types.ObjectId() },
//         update: {
//           $set: {
//             name: team.name,
//             house: team.house,
//             roundsParticipating: team.roundsParticipating || [1,2,3,4],
//             isActive: team.isActive !== false,
//             totalScore: team.totalScore || 0
//           }
//         },
//         upsert: true
//       }
//     }))
    

//     await Team.bulkWrite(operations)
//     return NextResponse.json({ success: true })
//   } catch (err) {
//     console.error(err)
//     return NextResponse.json({ error: 'Failed to update teams' }, { status: 500 })
//   }
// }

// export async function GET(req: NextRequest) {
//   try {
//     await connectDB()
//     const searchParams = new URL(req.url).searchParams
//     const round = searchParams.get('round')
//     const house = searchParams.get('house')

//     let query: any = {}
    
//     // Filter by round participation if specified
//     if (round) {
//       query.roundsParticipating = Number(round)
//     }

//     // Filter by house if specified
//     if (house) {
//       query.house = house
//     }

//     // Always show active teams first
//     const teams = await Team.find(query)
//       .sort({ isActive: -1, house: 1, name: 1 })
//       .exec()

//     return NextResponse.json(teams)
//   } catch (err) {
//     console.error(err)
//     return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
//   }
// }

// export async function DELETE(req: NextRequest) {
//   try {
//     await connectDB()
    
//     const user = getUserFromHeader(req.headers.get('authorization'))
//     if (!user || user.role !== 'admin') {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//     }

//     const data = await req.json()
//     const { teamId } = data

//     // Soft delete by setting isActive to false
//     await Team.findByIdAndUpdate(teamId, { isActive: false })
//     return NextResponse.json({ success: true })
//   } catch (err) {
//     console.error(err)
//     return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
//   }
// }



// import { NextRequest, NextResponse } from 'next/server'
// import { connectDB } from '@/lib/mongoose'
// import Team from '@/models/Teams' 
// import { getUserFromHeader } from '@/lib/roundHeadAuth'
// import { Types } from 'mongoose'

// export async function POST(req: NextRequest) {
//   try {
//     await connectDB()
    
//     const user = getUserFromHeader(req.headers.get('authorization'))
//     if (!user || user.role !== 'admin') {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//     }

//     const data = await req.json()
//     const { teams } = data
//     // Bulk create/update teams
//     const operations = teams.map((team: any) => ({
//       updateOne: {
//         filter: { _id: team._id || new Types.ObjectId() },
//         update: {
//           $set: {
//             name: team.name,
//             house: team.house,
//             roundsParticipating: team.roundsParticipating || [1,2,3,4],
//             isActive: team.isActive !== false,
//             // --- THIS IS THE FIX ---
//             // Mapped 'team.score' from the frontend
//             // to the 'totalPoints' field in your database model.
//             totalPoints: team.score || 0 
//           }
//         },
//         upsert: true
//       }
//     }))
    

//     await Team.bulkWrite(operations)
//     return NextResponse.json({ success: true })
//   } catch (err) {
//     console.error(err)
//     return NextResponse.json({ error: 'Failed to update teams' }, { status: 500 })
//   }
// }

// export async function GET(req: NextRequest) {
//   try {
//     await connectDB()
//     const searchParams = new URL(req.url).searchParams
//     const round = searchParams.get('round')
//     const house = searchParams.get('house')

//     let query: any = {}
    
//     // Filter by round participation if specified
//     if (round) {
//       query.roundsParticipating = Number(round)
//     }

//     // Filter by house if specified
//     if (house) {
//       query.house = house
//     }

//     // Always show active teams first
//     const teams = await Team.find(query)
//       .sort({ isActive: -1, house: 1, name: 1 })
//       .exec()

//     return NextResponse.json(teams)
//   } catch (err) {
//     console.error(err)
//     return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
//   }
// }

// export async function DELETE(req: NextRequest) {
//   try {
//     await connectDB()
    
//     const user = getUserFromHeader(req.headers.get('authorization'))
//     if (!user || user.role !== 'admin') {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//     }

//     const data = await req.json()
//     const { teamId } = data

//     // Soft delete by setting isActive to false
//     await Team.findByIdAndUpdate(teamId, { isActive: false })
//     return NextResponse.json({ success: true })
//   } catch (err) {
//     console.error(err)
//     return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
//   }
// }



import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
// --- CHANGE 1: Correct Model Import ---
import Team from '@/models/Team' // Changed from '@/models/Teams'
import { getUserFromHeader } from '@/lib/roundHeadAuth'
import { Types } from 'mongoose'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const user = getUserFromHeader(req.headers.get('authorization'))
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    // Assuming the structure might be { teams: [...] } based on original code comments
    // Adjust if the structure is different (e.g., just an array)
    const teamsArray = data.teams || data; // Handle both possibilities

    // Ensure we have an array
    if (!Array.isArray(teamsArray)) {
         return NextResponse.json(
            { success: false, error: 'Expected an array of teams' },
            { status: 400 }
         )
    }


    // Bulk create/update teams
    const operations = teamsArray.map((team: any) => ({
      updateOne: {
        // Use teamId for filtering if it exists (from Teams.ts), otherwise use _id or name
        filter: team.teamId ? { teamId: team.teamId } : (team._id ? { _id: team._id } : { name: team.name }),
        update: {
          $set: {
            // Include teamId if it was part of the potentially incorrect Teams.ts model
            ...(team.teamId && { teamId: team.teamId }),
            name: team.name,
            house: team.house,
            roundsParticipating: team.roundsParticipating || [1,2,3,4],
            isActive: team.isActive !== false,
            // --- CHANGE 2: Map score to totalPoints ---
            totalPoints: team.score ?? team.totalPoints ?? 0 // Prioritize score if sent, fallback to totalPoints, then 0
          }
        },
        upsert: true
      }
    }))


    await Team.bulkWrite(operations)
    // Fetch the updated/created teams to return them with correct IDs
    const updatedTeamNames = teamsArray.map((t: any) => t.name).filter(Boolean);
    const savedTeams = await Team.find({ name: { $in: updatedTeamNames } });

    return NextResponse.json({ success: true, teams: savedTeams }) // Return saved teams
  } catch (err) {
    console.error("POST /api/admin/teams error:", err) // More specific logging
    return NextResponse.json({ error: 'Failed to update teams' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const searchParams = new URL(req.url).searchParams
    const round = searchParams.get('round')
    const house = searchParams.get('house')

    let query: any = {}

    // Filter by round participation if specified
    if (round) {
      query.roundsParticipating = Number(round)
    }

    // Filter by house if specified
    if (house) {
      query.house = house
    }

    // Always show active teams first
    const teams = await Team.find(query)
      .sort({ isActive: -1, house: 1, name: 1 })
      .exec()

    // Return in the { teams: [...] } structure consistent with POST response
    return NextResponse.json({ teams: teams })
  } catch (err) {
    console.error("GET /api/admin/teams error:", err) // More specific logging
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB()

    const user = getUserFromHeader(req.headers.get('authorization'))
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const { teamId } = data // Assumes frontend sends the MongoDB _id as teamId

    if (!teamId) {
       return NextResponse.json({ error: 'Missing teamId' }, { status: 400 })
    }

    // It's safer to use findByIdAndUpdate which checks for a valid ObjectId format
    const result = await Team.findByIdAndUpdate(teamId, { isActive: false });

    if (!result) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("DELETE /api/admin/teams error:", err); // More specific logging
    // Handle potential CastError if teamId is not a valid ObjectId
    if ((err as Error).name === 'CastError') {
        return NextResponse.json({ error: 'Invalid teamId format' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}