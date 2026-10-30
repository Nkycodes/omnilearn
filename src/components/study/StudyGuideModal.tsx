import React, { useState } from 'react';
import { X, BookOpen, Download, Copy, Check, RefreshCw, Printer } from 'lucide-react';

interface StudyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyGuideText: string | null;
  workspaceTitle: string;
  onRegenerate: () => Promise<void>;
  isGenerating: boolean;
}

export const StudyGuideModal: React.FC<StudyGuideModalProps> = ({
  isOpen,
  onClose,
  studyGuideText,
  workspaceTitle,
  onRegenerate,
  isGenerating,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (studyGuideText) {
      navigator.clipboard.writeText(studyGuideText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!studyGuideText) return;
    const blob = new Blob([studyGuideText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workspaceTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_Study_Guide.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-950/70 border border-indigo-800/60 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Synthesized Study Guide
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-md">
                {workspaceTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              title="Regenerate guide with latest files"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Synthesizing...' : 'Regenerate'}</span>
            </button>
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Copy markdown"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Download Markdown"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Print study guide"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
              aria-label="Close study guide modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 flex-1 overflow-y-auto bg-slate-950/50 text-slate-200">
          {isGenerating ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm font-semibold text-slate-200">
                Reading audio transcripts, documents, and figures...
              </p>
              <p className="text-xs text-slate-400">
                Generating comprehensive cross-modal exam review guide
              </p>
            </div>
          ) : studyGuideText ? (
            <div className="prose prose-invert max-w-none text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {studyGuideText}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center gap-4 text-center">
              <BookOpen className="w-12 h-12 text-slate-600" />
              <div>
                <p className="text-base font-semibold text-slate-200">No Study Guide Generated Yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Click the button below to synthesize all your PDF notes, audio recordings, and diagram images into an exam-ready guide.
                </p>
              </div>
              <button
                onClick={onRegenerate}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg transition-all cursor-pointer"
              >
                Synthesize Study Guide Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
