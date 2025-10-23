import mongoose, { Schema, Document } from 'mongoose'

export interface ITeam extends Document {
  name: string
  house: 'Gryffindor' | 'Hufflepuff' | 'Ravenclaw' | 'Slytherin'
  totalPoints: number
  roundsParticipating: number[]
  isActive: boolean
  isEliminated?: boolean
}

const TeamSchema = new Schema<ITeam>({
  name: { type: String, required: true },
  house: { type: String, enum: ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'], required: true },
  totalPoints: { type: Number, default: 0 },
  roundsParticipating: { type: [Number], default: [1,2,3,4] },
 isActive: { type: Boolean, default: true },
 isEliminated: { type: Boolean, default: false },
})

export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema)

