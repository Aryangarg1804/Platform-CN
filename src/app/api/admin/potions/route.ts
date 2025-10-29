// src/app/api/admin/potions/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Potion from '@/models/Potion';
import Log from '@/models/Log';
import Team from '@/models/Team'; // Import Team model
import { Types } from 'mongoose';

// --- GET Potions ---
export async function GET() {
  try {
    await connectDB();
    const potions = await Potion.find({}).sort({ name: 1 });
    return NextResponse.json(potions || []);
  } catch (err) {
    console.error('GET /api/admin/potions error:', err);
    return NextResponse.json({ error: 'Failed to fetch potions' }, { status: 500 });
  }
}

// --- POST Create New Potion ---
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, ingredients } = body;

    // Validation
    if (!name || !ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: 'Potion name and at least one ingredient are required.' }, { status: 400 });
    }
    for (const ing of ingredients) {
        if (!ing.name || !ing.hint) {
            return NextResponse.json({ error: 'Each ingredient must have a name and a hint.' }, { status: 400 });
        }
    }
    const existingPotion = await Potion.findOne({ name });
    if (existingPotion) {
        return NextResponse.json({ error: `Potion with name "${name}" already exists.`}, { status: 409 });
    }

    const newPotion = new Potion({ name, ingredients, numberOfTimesCreated: 0 });
    await newPotion.save();

    // create a log for potion creation (try to obtain sender from header if present)
    try {
      const authHeader = (req as any).headers?.get?.('authorization')
      let senderEmail = undefined
      try {
        const { getUserFromHeader } = await import('@/lib/roundHeadAuth')
        const user = getUserFromHeader(authHeader)
        senderEmail = user?.email
      } catch (e) {
        // ignore
      }
      const msg = `${senderEmail || 'unknown'} created potion ${name}`
      await new Log({ message: msg, senderEmail, meta: { potionId: newPotion._id, ingredients } }).save()
    } catch (e) {
      console.error('Failed to create log for potion creation', e)
    }

    return NextResponse.json(newPotion, { status: 201 });

  } catch (err: any) {
    console.error('POST /api/admin/potions error:', err);
     if (err.code === 11000) {
        return NextResponse.json({ error: `Potion with name "${err.keyValue?.name}" already exists.` }, { status: 409 });
    }
    return NextResponse.json({ error: `Failed to create potion: ${err.message}` }, { status: 500 });
  }
}

// --- DELETE Potion ---
export async function DELETE(req: NextRequest) {
    // Optional: Add admin authorization check here
    try {
        await connectDB();
        const body = await req.json();
        const { potionId } = body;

        if (!potionId) {
            return NextResponse.json({ error: 'Potion ID is required.' }, { status: 400 });
        }

        let idToDelete: Types.ObjectId;
        try {
            idToDelete = new Types.ObjectId(potionId);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid Potion ID format.' }, { status: 400 });
        }

        // --- Important Safety Check ---
        // Find if any team is currently assigned this potion
        const teamsUsingPotion = await Team.find({ potionCreatedRound2: idToDelete }).limit(1); // Limit 1 for efficiency

        if (teamsUsingPotion.length > 0) {
            return NextResponse.json({ error: 'Cannot delete potion: It is currently assigned to one or more teams.' }, { status: 400 });
        }

        // Delete the potion
        const deleteResult = await Potion.findByIdAndDelete(idToDelete);

        if (!deleteResult) {
            return NextResponse.json({ error: 'Potion not found.' }, { status: 404 });
        }

        console.log(`Potion ${potionId} deleted successfully.`);
        return NextResponse.json({ success: true, message: 'Potion deleted successfully.' });

    } catch (err: any) {
        console.error('DELETE /api/admin/potions error:', err);
        return NextResponse.json({ error: `Failed to delete potion: ${err.message}` }, { status: 500 });
    }
}