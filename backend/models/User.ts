import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUserDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: 'Student Scholar',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
