import mongoose, { Schema, Document, Types } from 'mongoose';

// --- NEW Interface for Round 2 Pair Results ---
// This defines the structure we'll save for Round 2
export interface IRoundResultPair {
  teams: [Types.ObjectId, Types.ObjectId]; // Array containing two Team ObjectIds
  potionCreatedId?: Types.ObjectId | null; // Reference to the Potion ID
  points: number; // Points awarded for this action
  time: number;   // Time taken for this action
}

// --- Original Interface for other rounds (like Round 1) ---
export interface IRoundResult {
  team: Types.ObjectId;
  points: number;
  time: number;
  rank: number;
}

export interface IRound extends Document {
  roundNumber: number;
  name: string; // e.g., "round-1", "round-2"
  // This array will hold EITHER IRoundResultPair[] OR IRoundResult[]
  results: (IRoundResultPair | IRoundResult)[];
  isLocked: boolean;
  quaffleWinnerHouse?: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- Main Round Schema ---
const RoundSchema = new Schema<IRound>({
  roundNumber: { type: Number, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  // Use 'Mixed' to allow different objects in the array (pairs for R2, singles for R1)
  results: [Schema.Types.Mixed], 
  isLocked: { type: Boolean, default: true }, // Default to locked
  quaffleWinnerHouse: { type: String, required: false },
}, { timestamps: true });

// Note: When you save Round 2 data, you will manually push objects
// matching the 'IRoundResultPair' interface.
// When you save Round 1 data, you push objects matching 'IRoundResult'.

export default mongoose.models.Round || mongoose.model<IRound>('Round', RoundSchema);
