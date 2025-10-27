import mongoose, { Schema, Document } from 'mongoose'

// Define the ITeam interface for type safety (must be exported)
export interface ITeam extends Document { 
    name: string;
    house: 'Gryffindor' | 'Hufflepuff' | 'Ravenclaw' | 'Slytherin';
    totalPoints: number;
    score: number;
    roundsParticipating: number[];
    isActive: boolean;
    isEliminated: boolean;
}

// Define schema for a team (single source of truth)
const TeamSchema = new Schema(
  {
    name: { type: String, required: true },
    house: {
      type: String,
      required: true,
      enum: ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'],
    },
    // aggregated points across rounds
    totalPoints: { type: Number, default: 0 },
    // optional per-round temporary score
    score: { type: Number, default: 0 },
    // which rounds this team participates in (1..7)
    roundsParticipating: { type: [Number], default: [1, 2, 3, 4] },
    // whether team is currently active (not eliminated)
    isActive: { type: Boolean, default: true },
    // explicit eliminated flag for clarity
    isEliminated: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)

// Prevent model overwrite on hot reload in Next.js
export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema)
