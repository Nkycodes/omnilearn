import React from 'react';
import { X, FileText, Music, Image as ImageIcon, Download, ExternalLink } from 'lucide-react';
import { FileMetadata } from '../../types';
import { formatBytes } from '../../utils/studyLogic';

interface FilePreviewModalProps {
  file: FileMetadata | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-950/60 border border-indigo-800/60 text-indigo-400">
              {file.fileType === 'document' && <FileText className="w-5 h-5" />}
              {file.fileType === 'audio' && <Music className="w-5 h-5" />}
              {file.fileType === 'image' && <ImageIcon className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 truncate max-w-md">
                {file.originalName}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="uppercase font-medium text-indigo-400">{file.fileType}</span>
                <span>•</span>
                <span>{formatBytes(file.size)}</span>
                <span>•</span>
                <span>Uploaded {new Date(file.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={file.url}
              download={file.originalName}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
              aria-label="Close preview modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: File Preview Content */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center bg-slate-950/40 min-h-[300px]">
          {file.fileType === 'image' && (
            <div className="max-h-[55vh] flex items-center justify-center">
              <img
                src={file.url}
                alt={file.originalName}
                className="max-h-full max-w-full rounded-xl object-contain border border-slate-800 shadow-lg"
              />
            </div>
          )}

          {file.fileType === 'audio' && (
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                <Music className="w-8 h-8 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-200">{file.originalName}</p>
                <p className="text-xs text-slate-400 mt-1">Recorded Lecture Audio Track</p>
              </div>
              <audio controls className="w-full mt-2" src={file.url}>
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          {file.fileType === 'document' && (
            <div className="w-full h-[55vh] flex flex-col items-center justify-center">
              <iframe
                src={file.url}
                title={file.originalName}
                className="w-full h-full rounded-xl border border-slate-800 bg-white"
              />
            </div>
          )}

          {file.summary && (
            <div className="w-full mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300">
              <span className="font-semibold text-indigo-400 block mb-1">AI Context Index:</span>
              <p>{file.summary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
