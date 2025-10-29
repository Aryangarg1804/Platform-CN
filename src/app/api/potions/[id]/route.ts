// src/app/api/potions/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Potion from '@/models/Potion';
import { Types } from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Potion id is required' }, { status: 400 });
    }

    let objectId: Types.ObjectId;
    try {
      objectId = new Types.ObjectId(id);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid potion id format' }, { status: 400 });
    }

    const potion = await Potion.findById(objectId).lean();
    if (!potion) {
      return NextResponse.json({ error: 'Potion not found' }, { status: 404 });
    }

    return NextResponse.json(potion);
  } catch (err: any) {
    console.error('GET /api/potions/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch potion' }, { status: 500 });
  }
}
