export interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
}

export interface FileMetadata {
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
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  referencedFiles?: string[];
  suggestedFollowups?: string[];
  modelUsed?: string;
  groundingSources?: GroundingSource[];
  searchQueries?: string[];
}

export interface Workspace {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  userId: string;
  files: FileMetadata[];
  chatHistory: ChatMessage[];
  studyGuide?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
  message?: string;
}

export interface AlphaFoldStructure {
  uniprotAccession: string;
  gene: string;
  organism: string;
  cifUrl: string;
  pdbUrl: string;
  paeImageUrl: string;
  plddtConfidence: {
    veryHigh: number; // >90 (#0053D6)
    confident: number; // 70-90 (#65CBF3)
    low: number; // 50-70 (#FFDB13)
    veryLow: number; // <50 (#FF7D45)
    meanPlddt: number;
  };
}

export interface UniProtRecord {
  accession: string;
  proteinName: string;
  geneName: string;
  organism: string;
  sequenceLength: number;
  functionSummary: string;
  domains: Array<{ name: string; start: number; end: number }>;
}

export interface PubChemCompound {
  cid: number;
  name: string;
  molecularFormula: string;
  molecularWeight: number;
  canonicalSmiles: string;
  iupacName: string;
  imageUrl: string;
}

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  pubDate: string;
  doi?: string;
  url: string;
}

export interface VideoResult {
  videoUrl: string;
  duration: string;
  prompt: string;
  isSimulated?: boolean;
}
