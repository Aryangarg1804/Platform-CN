import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Round from '@/models/Round';
import Team from '@/models/Team';
import Potion from '@/models/Potion';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { team1Id, team2Id, potionId, points, time } = body;

    if (!team1Id || !team2Id || !potionId || typeof points === 'undefined' || typeof time === 'undefined') {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Check round lock status from RoundStatus collection (single source of truth for locks)
    const RoundStatus = (await import('@/models/RoundStatus')).default;
    const statusDoc = await RoundStatus.findOne({ round: 'round-2' });
    const isLockedStatus = statusDoc ? statusDoc.isLocked : (await Round.findOne({ name: 'round-2' }))?.isLocked ?? true;
    if (isLockedStatus) {
      return NextResponse.json({ success: false, error: 'Round is locked' }, { status: 403 });
    }

    // Find or create round document
    let round = await Round.findOne({ name: 'round-2' });
    if (!round) {
      // create if missing
      round = new Round({ roundNumber: 2, name: 'round-2', results: [], isLocked: false });
    }

    // Create result entry
    const resultEntry: any = {
      teams: [team1Id, team2Id],
      potionCreatedId: potionId,
      points: Number(points),
      score: Number(points),
      time: Number(time)
    };

    round.results.push(resultEntry as any);
    await round.save();

    // Update both teams: set potionCreatedRound2 and add points to totalPoints and score
    const update = {
      $set: { potionCreatedRound2: potionId },
      $inc: { totalPoints: Number(points), score: Number(points) }
    };

    await Team.updateOne({ _id: team1Id }, update);
    await Team.updateOne({ _id: team2Id }, update);

    // Increment potion's numberOfTimesCreated
    await Potion.updateOne({ _id: potionId }, { $inc: { numberOfTimesCreated: 1 } });

    return NextResponse.json({ success: true, result: resultEntry });
  } catch (err: any) {
    console.error('POST /api/admin/round-2/submit-pair error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
