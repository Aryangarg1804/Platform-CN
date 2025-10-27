import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IRoundResult {
  team: Types.ObjectId
  points: number
  time: number // seconds from start or finish timestamp
  rank: number // 1..24 (or smaller for rounds with fewer houses)
}

export interface IRound extends Document {
  roundNumber: number
  name: string
  results: IRoundResult[]
  isLocked: boolean
  quaffleWinnerHouse?: string; // <<< NEW FIELD
  createdAt: Date
  updatedAt: Date
}

const RoundResultSchema = new Schema<IRoundResult>({
  team: { type: Schema.Types.ObjectId, ref: 'Team' },
  points: Number,
  time: Number,
  rank: Number,
})

const RoundSchema = new Schema<IRound>({
  roundNumber: { type: Number, required: true, unique: true },
  name: String,
  results: [RoundResultSchema],
  isLocked: { type: Boolean, default: false },
  quaffleWinnerHouse: { type: String, required: false }, // <<< NEW SCHEMA FIELD
}, { timestamps: true })

export default mongoose.models.Round || mongoose.model<IRound>('Round', RoundSchema)