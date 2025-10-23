import { NextRequest, NextResponse } from 'next/server'

// Lightweight Anthropic proxy for Sonnet 3.5
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const prompt = body.prompt
    const model = body.model || 'claude-sonnet-3.5'

    const key = process.env.ANTHROPIC_API_KEY
    if (!key) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 501 })
    }

    const resp = await fetch(`https://api.anthropic.com/v1/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    if (!resp.ok) {
      const text = await resp.text()
      return NextResponse.json({ error: 'Anthropic API error', details: text }, { status: 502 })
    }

    const data = await resp.json()
    return NextResponse.json({ result: data })
  } catch (err) {
    console.error('Anthropic proxy error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
