import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

export function detectFileType(mimeType: string, filename: string): 'document' | 'image' | 'audio' | 'other' {
  const lowerMime = mimeType.toLowerCase();
  const ext = path.extname(filename).toLowerCase();

  if (lowerMime.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)) {
    return 'image';
  }
  if (lowerMime.startsWith('audio/') || ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac'].includes(ext)) {
    return 'audio';
  }
  if (
    lowerMime.includes('pdf') ||
    lowerMime.includes('text') ||
    lowerMime.includes('document') ||
    ['.pdf', '.txt', '.md', '.doc', '.docx', '.rtf'].includes(ext)
  ) {
    return 'document';
  }
  return 'other';
}

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExts = [
    '.pdf', '.txt', '.md',
    '.png', '.jpg', '.jpeg', '.webp',
    '.mp3', '.wav', '.m4a', '.ogg'
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/') || file.mimetype.includes('pdf')) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${ext}. OmniLearn accepts PDF, images, and audio files.`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 MB
  },
});
