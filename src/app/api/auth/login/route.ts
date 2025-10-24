// src/app/api/auth/login/route.ts

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
// Import both the model and the NEW base interface
import User, { IUserBase } from '@/models/Users';
import { signToken } from '@/lib/auth';

export async function POST(req: Request): Promise<NextResponse> {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });
    }

    // Use IUserBase to correctly type the plain object from .lean()
    const user: IUserBase | null = await User.findOne({ email })
      .select('+password')
      .lean<IUserBase>();

    if (!user || !user.password) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // The rest of your code works perfectly!
    const passwordMatches = password === user.password;

    if (!passwordMatches) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({
      id: user._id,
      email: user.email,
      role: user.role,
      roundAssigned: user.roundAssigned,
    });
    
    const userForResponse = {
      email: user.email,
      name: user.name,
      role: user.role,
      roundAssigned: user.roundAssigned,
    };

    return NextResponse.json({ 
      success: true, 
      token, 
      user: userForResponse 
    });

  } catch (err) {
    console.error('POST /api/auth/login error', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}