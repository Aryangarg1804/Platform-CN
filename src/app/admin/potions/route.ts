// src/app/api/admin/potions/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Potion from '@/models/Potion';

// --- GET Potions ---
export async function GET() {
  try {
    await connectDB();
    const potions = await Potion.find({}).sort({ name: 1 });
    // Ensure the response is always an array, even if empty
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
    await newPotion.save(); // This line will create the collection if it doesn't exist

    return NextResponse.json(newPotion, { status: 201 });

  } catch (err: any) {
    console.error('POST /api/admin/potions error:', err);
     if (err.code === 11000) { // Handle potential duplicate key error during save
        return NextResponse.json({ error: `Potion with name "${err.keyValue?.name}" already exists.` }, { status: 409 });
    }
    return NextResponse.json({ error: `Failed to create potion: ${err.message}` }, { status: 500 });
  }
}