import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Round from '@/models/Round';

export async function GET() {
  try {
    await connectDB();
    const round = await Round.findOne({ name: 'round-2' })
      .populate({
        path: 'results.teams',
        select: 'name house totalPoints potionCreatedRound2',
        // populate the team's potionCreatedRound2 directly so we can return the potion name
        populate: { path: 'potionCreatedRound2', select: 'name', model: 'Potion' }
      })
      .populate({ path: 'results.potionCreatedId', select: 'name' });

    if (!round) return NextResponse.json({ round: { results: [] } });

    const results = (round.results || []).map((r: any) => {
      const teams = (r.teams || []).map((t: any) => ({
        _id: t?._id?.toString(),
        name: t?.name,
        house: t?.house,
        totalPoints: t?.totalPoints || 0,
        potionCreatedName: t?.potionCreatedRound2 ? (t.potionCreatedRound2.name || null) : null
      }));
      const potionCreated = r.potionCreatedId ? { _id: r.potionCreatedId._id?.toString(), name: r.potionCreatedId.name } : null;
      return {
        _id: r._id?.toString(),
        teams,
        potionCreated,
        points: r.points || 0,
        score: r.score || 0,
        time: r.time || 0
      };
    });

    return NextResponse.json({ round: { results, isLocked: round.isLocked } });
  } catch (err: any) {
    console.error('GET /api/rounds/round-2 error:', err);
    return NextResponse.json({ error: 'Failed to fetch round data', details: err.message || null }, { status: 500 });
  }
}
