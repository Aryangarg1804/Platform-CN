// src/models/Users.ts

import mongoose, { Schema, Document } from 'mongoose';

export type Role = 'admin' | 'round-head' | 'public';

// This interface for the .lean() object is correct and does not need to change.
export interface IUserBase {
  _id: mongoose.Types.ObjectId;
  email: string;
  name?: string;
  role: Role;
  roundAssigned?: number;
  password?: string;
}

// CHANGE THIS LINE: Use Omit to prevent the _id property conflict.
export interface IUser extends Omit<IUserBase, '_id'>, Document {}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  name: String,
  role: { type: String, enum: ['admin', 'round-head', 'public'], default: 'public' },
  roundAssigned: Number,
  password: { type: String, select: false },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);