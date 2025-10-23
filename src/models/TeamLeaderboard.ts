import mongoose, { Schema } from 'mongoose'

const TeamLeaderboardSchema = new Schema({
  team: { type: String, required: true },   // Team name
  house: { type: String, required: true },  // House of the team
  score: { type: Number, default: 0 },      // Team score
}, { timestamps: true })

export default mongoose.models.TeamLeaderboard || mongoose.model('TeamLeaderboard', TeamLeaderboardSchema)
