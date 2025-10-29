// src/models/Potion.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface for an ingredient sub-array
export interface IIngredient {
  name: string;
  hint: string;
}

// Interface for the Potion document
export interface IPotion extends Document {
  name: string;
  numberOfTimesCreated: number;
  ingredients: IIngredient[]; // Array of ingredient objects
}

// Schema for an ingredient
const IngredientSchema = new Schema<IIngredient>({
  name: { type: String, required: true },
  hint: { type: String, required: true },
}, { _id: false }); // Prevent Mongoose from creating _id for subdocuments

// Schema for a potion
const PotionSchema = new Schema<IPotion>({
  name: { type: String, required: true, unique: true },
  numberOfTimesCreated: { type: Number, default: 0 },
  ingredients: { type: [IngredientSchema], required: true }, // Use the IngredientSchema
}, { timestamps: true });

// Prevent model overwrite on hot reload in Next.js
export default mongoose.models.Potion || mongoose.model<IPotion>('Potion', PotionSchema);