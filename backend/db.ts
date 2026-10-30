import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

export interface IFileMetadata {
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

export interface IChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  referencedFiles?: string[];
  suggestedFollowups?: string[];
  modelUsed?: string;
  groundingSources?: Array<{ title: string; url: string }>;
  searchQueries?: string[];
}

export interface IWorkspace {
  _id: string;
  id: string;
  title: string;
  description?: string;
  userId: string;
  files: IFileMetadata[];
  chatHistory: IChatMessage[];
  studyGuide?: string;
  quizzes?: Array<{
    id: string;
    title: string;
    createdAt: string;
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  _id: string;
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

// In-memory / file-backed fallback storage
const DATA_DIR = path.resolve(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const WORKSPACES_FILE = path.join(DATA_DIR, 'workspaces.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadJson<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as T;
    }
  } catch (err) {
    console.error(`Failed to read ${filePath}:`, err);
  }
  return fallback;
}

function saveJson<T>(filePath: string, data: T) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Failed to write ${filePath}:`, err);
  }
}

let inMemoryUsers: IUser[] = loadJson<IUser[]>(USERS_FILE, []);
let inMemoryWorkspaces: IWorkspace[] = loadJson<IWorkspace[]>(WORKSPACES_FILE, []);
let isMongoConnected = false;

function safeEncode(val: string): string {
  try {
    // Decode first in case parts were already percent-encoded to prevent double-encoding
    return encodeURIComponent(decodeURIComponent(val));
  } catch {
    return encodeURIComponent(val);
  }
}

/**
 * Sanitizes MongoDB connection URIs by ensuring reserved characters in username
 * and password (e.g. '@', ':', '#', '%', '?', '/') are correctly percent-encoded.
 */
export function sanitizeMongoUri(rawUri: string): string {
  if (!rawUri || typeof rawUri !== 'string') return '';
  let uri = rawUri.trim().replace(/^["']|["']$/g, '').trim();

  // Must match mongodb:// or mongodb+srv://
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^/]+)(.*)$/);
  if (!match) return uri;

  const prefix = match[1];
  const authority = match[2];
  const rest = match[3];

  const lastAt = authority.lastIndexOf('@');
  if (lastAt === -1) {
    // No credentials in URI
    return uri;
  }

  const userinfo = authority.substring(0, lastAt);
  const host = authority.substring(lastAt + 1);

  const firstColon = userinfo.indexOf(':');
  if (firstColon === -1) {
    const safeUser = safeEncode(userinfo);
    return `${prefix}${safeUser}@${host}${rest}`;
  }

  const rawUser = userinfo.substring(0, firstColon);
  const rawPass = userinfo.substring(firstColon + 1);

  const safeUser = safeEncode(rawUser);
  const safePass = safeEncode(rawPass);

  return `${prefix}${safeUser}:${safePass}@${host}${rest}`;
}

export async function initDatabase(): Promise<boolean> {
  // Pre-seed demo user if empty
  if (inMemoryUsers.length === 0) {
    const passwordHash = '$2a$10$w6D4Tsz.w2yH8oQjIkn.0eDk113l/70ZmgBmzQ8s4pfg0gX32p0s6'; // password123
    inMemoryUsers.push({
      _id: 'user_demo_scholar',
      id: 'user_demo_scholar',
      email: 'scholar@omnilearn.ai',
      passwordHash,
      name: 'Scholar Alex',
      createdAt: new Date().toISOString(),
    });
    saveJson(USERS_FILE, inMemoryUsers);
  }

  const rawMongoUri = process.env.MONGO_URI;
  if (!rawMongoUri || rawMongoUri.trim() === '' || rawMongoUri === 'MY_MONGO_URI' || rawMongoUri.includes('<password>') || rawMongoUri.includes('<USERNAME>') || rawMongoUri.includes('<') || rawMongoUri.includes('>')) {
    console.log('[DB] No valid MONGO_URI specified. Operating with embedded persistent store.');
    return false;
  }

  // Sanitize connection URI to properly percent-encode password and username
  const cleanUri = sanitizeMongoUri(rawMongoUri);

  try {
    await mongoose.connect(cleanUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isMongoConnected = true;
    console.log('[DB] Connected to MongoDB Atlas successfully.');
    return true;
  } catch (err) {
    console.warn('[DB] MongoDB connection failed or timed out. Operating in embedded store mode:', (err as Error).message);
    isMongoConnected = false;
    return false;
  }
}

// User CRUD Helpers
export const UserStore = {
  async findByEmail(email: string): Promise<IUser | null> {
    const normalized = email.toLowerCase().trim();
    const user = inMemoryUsers.find(u => u.email.toLowerCase() === normalized);
    return user ? { ...user } : null;
  },

  async findById(id: string): Promise<IUser | null> {
    const user = inMemoryUsers.find(u => u.id === id || u._id === id);
    return user ? { ...user } : null;
  },

  async create(user: Omit<IUser, '_id' | 'id' | 'createdAt'>): Promise<IUser> {
    const id = 'user_' + Math.random().toString(36).substring(2, 10);
    const newUser: IUser = {
      ...user,
      _id: id,
      id,
      email: user.email.toLowerCase().trim(),
      createdAt: new Date().toISOString(),
    };
    inMemoryUsers.push(newUser);
    saveJson(USERS_FILE, inMemoryUsers);
    return newUser;
  },

  async count(): Promise<number> {
    return inMemoryUsers.length;
  }
};

// Workspace CRUD Helpers
export const WorkspaceStore = {
  async findByUserId(userId: string): Promise<IWorkspace[]> {
    return inMemoryWorkspaces
      .filter(w => w.userId === userId)
      .map(w => ({ ...w }));
  },

  async findById(id: string): Promise<IWorkspace | null> {
    const ws = inMemoryWorkspaces.find(w => w.id === id || w._id === id);
    return ws ? { ...ws } : null;
  },

  async create(workspaceData: { title: string; description?: string; userId: string }): Promise<IWorkspace> {
    const id = 'ws_' + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();
    const newWs: IWorkspace = {
      _id: id,
      id,
      title: workspaceData.title,
      description: workspaceData.description || 'Multimodal study workspace for document, audio, and visual synthesis.',
      userId: workspaceData.userId,
      files: [],
      chatHistory: [
        {
          id: 'welcome_' + Date.now(),
          role: 'assistant',
          content: `Welcome to **${workspaceData.title}**! 🎓\n\nI am your multimodal AI study assistant powered by Gemini. You can:\n- Upload lecture recordings, PDFs, and whiteboard photos\n- Ask me to synthesize knowledge across all files\n- Generate structured study guides, summaries, and practice quizzes\n- Explore your materials in the **3D Multimodal Knowledge Space**!\n\nUpload a file or ask any question to get started.`,
          timestamp: now,
          referencedFiles: [],
          suggestedFollowups: [
            "What can you do with my uploaded files?",
            "How do I generate a study guide?",
            "Explain the connections between my lecture audio and PDF notes"
          ]
        }
      ],
      createdAt: now,
      updatedAt: now,
    };
    inMemoryWorkspaces.push(newWs);
    saveJson(WORKSPACES_FILE, inMemoryWorkspaces);
    return newWs;
  },

  async update(id: string, updates: Partial<IWorkspace>): Promise<IWorkspace | null> {
    const index = inMemoryWorkspaces.findIndex(w => w.id === id || w._id === id);
    if (index === -1) return null;

    inMemoryWorkspaces[index] = {
      ...inMemoryWorkspaces[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveJson(WORKSPACES_FILE, inMemoryWorkspaces);
    return { ...inMemoryWorkspaces[index] };
  },

  async delete(id: string): Promise<boolean> {
    const initialLen = inMemoryWorkspaces.length;
    inMemoryWorkspaces = inMemoryWorkspaces.filter(w => w.id !== id && w._id !== id);
    if (inMemoryWorkspaces.length !== initialLen) {
      saveJson(WORKSPACES_FILE, inMemoryWorkspaces);
      return true;
    }
    return false;
  },

  async addFile(workspaceId: string, file: IFileMetadata): Promise<IWorkspace | null> {
    const ws = inMemoryWorkspaces.find(w => w.id === workspaceId || w._id === workspaceId);
    if (!ws) return null;
    ws.files.push(file);
    ws.updatedAt = new Date().toISOString();
    saveJson(WORKSPACES_FILE, inMemoryWorkspaces);
    return { ...ws };
  },

  async removeFile(workspaceId: string, fileId: string): Promise<IWorkspace | null> {
    const ws = inMemoryWorkspaces.find(w => w.id === workspaceId || w._id === workspaceId);
    if (!ws) return null;
    ws.files = ws.files.filter(f => f.id !== fileId);
    ws.updatedAt = new Date().toISOString();
    saveJson(WORKSPACES_FILE, inMemoryWorkspaces);
    return { ...ws };
  },

  async addChatMessage(workspaceId: string, message: IChatMessage): Promise<IWorkspace | null> {
    const ws = inMemoryWorkspaces.find(w => w.id === workspaceId || w._id === workspaceId);
    if (!ws) return null;
    ws.chatHistory.push(message);
    ws.updatedAt = new Date().toISOString();
    saveJson(WORKSPACES_FILE, inMemoryWorkspaces);
    return { ...ws };
  }
};
