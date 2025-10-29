import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ILog extends Document {
  message: string
  senderEmail?: string
  senderId?: Types.ObjectId | null
  round?: string
  points?: number
  meta?: any
  createdAt: Date
  updatedAt: Date
}

const LogSchema = new Schema<ILog>(
  {
    message: { type: String, required: true },
    senderEmail: { type: String },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    round: { type: String, required: false },
    points: { type: Number, required: false },
    meta: { type: Schema.Types.Mixed, required: false },
  },
  { timestamps: true }
)

export default mongoose.models.Log || mongoose.model<ILog>('Log', LogSchema)
