
// import { NextResponse } from 'next/server'
// import { connectDB } from '@/lib/mongoose'
// import Round from '@/models/Round'
// import Team from '@/models/Team'
// import Potion from '@/models/Potion'

// // Prevent Next.js from statically prerendering this route
// export const dynamic = 'force-dynamic'

// export async function GET() {
//   try {
//     await connectDB()

//     const round = await Round.findOne({ name: 'round-2' })
//       .populate({
//         path: 'results.teams',
//         select: 'name house totalPoints potionCreatedRound2',
//         populate: { path: 'potionCreatedRound2', select: 'name', model: 'Potion' },
//       })
//       .populate({ path: 'results.potionCreatedId', select: 'name' })

//     if (!round) {
//       return NextResponse.json({ round: { results: [] } })
//     }

//     const results = (round.results || []).map((r: any) => {
//       const teams = (r.teams || [])
//         .filter(Boolean)
//         .map((t: any) => ({
//           _id: t?._id?.toString(),
//           name: t?.name || '',
//           house: t?.house || '',
//           totalPoints: t?.totalPoints || 0,
//           potionCreatedName: t?.potionCreatedRound2?.name || null,
//         }))

//       const potionCreated = r.potionCreatedId
//         ? { _id: r.potionCreatedId._id?.toString(), name: r.potionCreatedId.name }
//         : null

//       return {
//         _id: r._id?.toString(),
//         teams,
//         potionCreated,
//         points: r.points || 0,
//         score: r.score || 0,
//         time: r.time || 0,
//       }
//     })

//     return NextResponse.json({
//       round: { results, isLocked: round.isLocked },
//     })
//   } catch (err: any) {
//     console.error('GET /api/rounds/round-2 error:', err)
//     return NextResponse.json(
//       {
//         error: 'Failed to fetch round data',
//         details: err.message || null,
//       },
//       { status: 500 }
//     )
//   }
// }



// src/app/api/rounds/round-2/route.ts

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Round, { IRound, IRoundResultPair } from '@/models/Round'; // Import interfaces if needed
import Team from '@/models/Team';
import Potion from '@/models/Potion';
import { Types } from 'mongoose'; // Import Types for ObjectId validation if needed

// Prevent Next.js from statically prerendering this route
export const dynamic = 'force-dynamic';

// Define a more specific type for the lean result, including optional quaffle winner
type LeanRound2Data = Omit<IRound, 'results' | '_id'> & {
    _id: Types.ObjectId; // Keep _id
    results?: IRoundResultPair[]; // Specify results type for Round 2
    quaffleWinnerHouse?: string | null;
} | null; // Allow null if not found


export async function GET() {
  try {
    await connectDB();

    // Fetch the round document, including the quaffleWinnerHouse field
    const round: LeanRound2Data = await Round.findOne({ name: 'round-2' })
      .select('+quaffleWinnerHouse') // Ensure this field is selected
      .populate<{ results: { teams: any[], potionCreatedId: any }[] }>([ // Use PopulateOptions type if available
        {
          path: 'results.teams',
          select: 'name house totalPoints potionCreatedRound2', // Fields for Team
          populate: { path: 'potionCreatedRound2', select: 'name', model: 'Potion' }, // Nested populate for Potion name in Team
        },
        {
          path: 'results.potionCreatedId', // Populate the Potion ID directly linked in results
          select: 'name', // Select only the name
          model: 'Potion',
        }
      ])
      .lean<LeanRound2Data>(); // Apply the more specific Lean type

    // Handle case where the round document itself doesn't exist
    if (!round) {
      console.warn('Round "round-2" not found in database.');
      // Return a default structure indicating not found or empty
      return NextResponse.json({
        round: { results: [], name: 'round-2', quaffleWinnerHouse: null, isLocked: true } // Default to locked if not found
      });
    }

    // Process results safely, checking if 'results' exists and is an array
    const results = (round.results || []).map((r) => {
      // Ensure 'teams' is an array before mapping
      const teams = Array.isArray(r.teams)
        ? r.teams
            .filter(Boolean) // Filter out any null/undefined team references if population failed partially
            .map((t: any) => ({
              _id: t?._id?.toString(),
              name: t?.name || 'Unknown Team', // Provide default names
              house: t?.house || 'Unknown House',
              totalPoints: t?.totalPoints || 0,
              // Safely access nested populated potion name *within* the team document
              potionCreatedName: t?.potionCreatedRound2?.name || null,
            }))
        : []; // Default to empty array if r.teams is not an array

      // Handle the potionCreatedId directly populated in the result item
      const potionCreated = r.potionCreatedId
        ? { _id: (r.potionCreatedId as any)._id?.toString(), name: (r.potionCreatedId as any).name || 'Unknown Potion' }
        : null;

      return {
        _id: (r as any)._id?.toString(), // Map the result item's _id
        teams,
        potionCreated, // Use the directly populated potion info
        points: r.points || 0,
        score: r.score || 0, // Include score if it exists
        time: r.time || 0,
      };
    });

    // Construct the response object clearly separating round metadata and results
    const responseRoundData = {
      results: results,
      isLocked: round.isLocked ?? true, // Default to locked if undefined
      name: round.name || 'round-2', // Use found name or default
      quaffleWinnerHouse: round.quaffleWinnerHouse || null, // Use found winner or null
      // Add other relevant round metadata if needed, e.g., roundNumber
      roundNumber: round.roundNumber,
    };

    return NextResponse.json({
      round: responseRoundData, // Return the structured data
    });

  } catch (err: any) {
    console.error('GET /api/rounds/round-2 error:', err);
    // Provide a more generic error to the client for security
    return NextResponse.json(
      {
        error: 'Failed to fetch round data. Please check server logs for details.',
        // Optionally include details in non-production environments
        // details: process.env.NODE_ENV !== 'production' ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}