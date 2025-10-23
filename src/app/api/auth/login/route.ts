import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import User from '@/models/Users'
import { signToken } from '@/lib/auth'

// Simple login: { email, password }
export async function POST(req: Request) {
  try {
    await connectDB()
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 })

    const user = await User.findOne({ email }).lean()
    if (!user) return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })

    // verify password - if hash present, try bcryptjs, else fallback to plain text compare
    const hash = (user as any).hash
    let ok = false
    if (hash) {
      try {
        // dynamic import to avoid adding explicit dep if not installed
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const bcrypt = require('bcryptjs')
        ok = await bcrypt.compare(password, hash)
      } catch (e) {
        console.warn('bcryptjs not available; cannot verify hashed password')
        ok = false
      }
    } else {
      // fallback insecure compare
      ok = password === (user as any).plainPassword || false
    }

    if (!ok) return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })

    const u: any = user
    const token = signToken({ id: u._id, email: u.email, role: u.role, roundAssigned: u.roundAssigned })
    return NextResponse.json({ success: true, token, user: { email: u.email, role: u.role, roundAssigned: u.roundAssigned } })
  } catch (err) {
    console.error('POST /api/auth/login error', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
