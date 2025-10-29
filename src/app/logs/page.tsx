import React from 'react'
import { connectDB } from '@/lib/mongoose'
import Log from '@/models/Log'

export default async function LogsPage() {
  try {
    await connectDB()
    const logs = await Log.find({}).sort({ createdAt: -1 }).limit(200).lean()

    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Activity Logs</h1>
        <div style={{ marginBottom: 16, color: '#666' }}>Latest actions performed by admins and round-heads.</div>
        <div>
          {logs.length === 0 && <div>No logs yet.</div>}
          {logs.map((l: any) => (
            <div key={l._id} style={{ padding: 12, borderBottom: '1px solid #eee' }}>
              <div style={{ fontSize: 14, color: '#333' }}>{l.message}</div>
              <div style={{ fontSize: 12, color: '#777', marginTop: 6 }}>
                <span>{l.senderEmail || 'system'}</span>
                {' · '}
                <span>{l.round || 'global'}</span>
                {' · '}
                <span>{new Date(l.createdAt).toLocaleString()}</span>
                {l.points ? <> {' · '} <strong>{l.points} pts</strong></> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  } catch (err) {
    console.error('Failed to render logs page', err)
    return (
      <div style={{ padding: 24 }}>
        <h1>Activity Logs</h1>
        <div style={{ color: 'red' }}>Failed to fetch logs.</div>
      </div>
    )
  }
}
