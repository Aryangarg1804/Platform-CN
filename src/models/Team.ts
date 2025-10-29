import mongoose, { Schema, Document, Types } from 'mongoose';

// Define the ITeam interface for type safety (must be exported)
export interface ITeam extends Document { 
    name: string;
    house: 'Gryffindor' | 'Hufflepuff' | 'Ravenclaw' | 'Slytherin';
    totalPoints: number;
    score: number; // This remains from your original schema
    roundsParticipating: number[];
    isActive: boolean;
    isEliminated: boolean;
    potionCreatedRound2?: Types.ObjectId | null; // <-- ADDED FIELD
}

// Define schema for a team (single source of truth)
const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, unique: true }, // Make name unique
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
    
    // --- ADD THIS FIELD ---
    potionCreatedRound2: {
        type: Schema.Types.ObjectId,
        ref: 'Potion', // This links it to your Potion model
        required: false,
        default: null
    }
  },
  {
    timestamps: true,
  }
);

// Prevent model overwrite on hot reload in Next.js
export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
