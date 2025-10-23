import mongoose, { Schema } from 'mongoose'

const HouseLeaderboardSchema = new Schema({
    house: { type: String, required: true },  // Gryffindor / Hufflepuff / Ravenclaw / Slytherin
    totalScore: { type: Number, default: 0 }, // Sum of all team scores in the house
    // number of quaffles (round wins) this house has earned
    quaffles: { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.models.HouseLeaderboard || mongoose.model('HouseLeaderboard', HouseLeaderboardSchema)
