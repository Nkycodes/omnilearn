export interface StudyFile {
  id: string;
  originalName: string;
  fileType: 'document' | 'image' | 'audio' | 'other';
  size: number;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function categorizeFile(filename: string, mimeType: string): 'document' | 'image' | 'audio' | 'other' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mime = mimeType.toLowerCase();

  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
    return 'image';
  }
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'ogg', 'aac'].includes(ext)) {
    return 'audio';
  }
  if (mime.includes('pdf') || mime.includes('text') || ['pdf', 'txt', 'md', 'doc', 'docx'].includes(ext)) {
    return 'document';
  }
  return 'other';
}

export function validateWorkspaceTitle(title: string): { valid: boolean; error?: string } {
  if (!title || typeof title !== 'string') {
    return { valid: false, error: 'Title cannot be empty.' };
  }
  const trimmed = title.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: 'Title must be at least 2 characters.' };
  }
  if (trimmed.length > 80) {
    return { valid: false, error: 'Title cannot exceed 80 characters.' };
  }
  return { valid: true };
}

export function buildMultimodalCitationList(files: StudyFile[]): string {
  if (files.length === 0) return 'No media sources attached.';
  return files.map(f => `[${f.originalName} (${f.fileType.toUpperCase()})]`).join(', ');
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export function calculateQuizScore(
  userAnswers: Record<number, number>,
  questions: QuizQuestion[]
): { score: number; total: number; percentage: number; passed: boolean } {
  const total = questions.length;
  if (total === 0) return { score: 0, total: 0, percentage: 0, passed: false };

  let score = 0;
  questions.forEach((q, idx) => {
    if (userAnswers[idx] === q.correctAnswer) {
      score += 1;
    }
  });

  const percentage = Math.round((score / total) * 100);
  return {
    score,
    total,
    percentage,
    passed: percentage >= 70,
  };
}

export function extractKeyTerms(markdownText: string): string[] {
  // Extract terms wrapped in **bold** or `code`
  const boldRegex = /\*\*([^*]+)\*\*/g;
  const terms: string[] = [];
  let match;
  while ((match = boldRegex.exec(markdownText)) !== null) {
    const term = match[1].trim();
    if (term.length > 2 && term.length < 40 && !terms.includes(term)) {
      terms.push(term);
    }
  }
  return terms.slice(0, 10);
}
