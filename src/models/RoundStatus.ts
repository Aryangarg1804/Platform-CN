import mongoose, { Schema } from 'mongoose'

const RoundStatusSchema = new Schema({
  round: { type: String, required: true, unique: true }, // e.g., "round-1"
  isLocked: { type: Boolean, default: true },            // true = locked, false = unlocked
}, { timestamps: true })

export default mongoose.models.RoundStatus || mongoose.model('RoundStatus', RoundStatusSchema)
