import mongoose, { Schema, Document } from 'mongoose';

export interface IFileMetadataDoc {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  fileType: 'document' | 'image' | 'audio' | 'other';
  path: string;
  url: string;
  uploadedAt: string;
  summary?: string;
  extractedText?: string;
}

export interface IChatMessageDoc {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  referencedFiles?: string[];
  suggestedFollowups?: string[];
}

export interface IWorkspaceDocument extends Document {
  title: string;
  description?: string;
  userId: string;
  files: IFileMetadataDoc[];
  chatHistory: IChatMessageDoc[];
  studyGuide?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FileMetadataSchema = new Schema<IFileMetadataDoc>({
  id: { type: String, required: true },
  originalName: { type: String, required: true },
  filename: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  fileType: { type: String, enum: ['document', 'image', 'audio', 'other'], required: true },
  path: { type: String, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: String, required: true },
  summary: { type: String },
  extractedText: { type: String },
});

const ChatMessageSchema = new Schema<IChatMessageDoc>({
  id: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: String, required: true },
  referencedFiles: [{ type: String }],
  suggestedFollowups: [{ type: String }],
});

const WorkspaceSchema = new Schema<IWorkspaceDocument>({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: 'Multimodal study workspace' },
  userId: { type: String, required: true },
  files: [FileMetadataSchema],
  chatHistory: [ChatMessageSchema],
  studyGuide: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const WorkspaceModel = mongoose.models.Workspace || mongoose.model<IWorkspaceDocument>('Workspace', WorkspaceSchema);
