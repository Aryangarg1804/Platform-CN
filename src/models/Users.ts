import mongoose, { Schema, Document } from 'mongoose'

export type Role = 'admin' | 'round-head' | 'public'

export interface IUser extends Document {
  email: string
  name?: string
  role: Role
  roundAssigned?: number // 1..7 for round-heads
  hash?: string // password hash if using credentials
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  name: String,
  role: { type: String, enum: ['admin','round-head','public'], default: 'public' },
  roundAssigned: Number,
  hash: String,
})

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
