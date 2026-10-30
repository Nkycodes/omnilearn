import React, { useState } from 'react';
import {
  X,
  Video,
  Sparkles,
  Play,
  RotateCcw,
  Loader2,
  Film,
  Download,
  Ratio,
  Info
} from 'lucide-react';
import { videoApi } from '../../api/client';
import { VideoResult } from '../../types';

interface VideoGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export const VideoGeneratorModal: React.FC<VideoGeneratorModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = 'Explain the backpropagation gradient flow through neural network activation layers.',
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isLoading, setIsLoading] = useState(false);
  const [videoResult, setVideoResult] = useState<VideoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await videoApi.generateVideo(prompt.trim(), aspectRatio);
      if (res.success) {
        setVideoResult({
          videoUrl: res.videoUrl,
          duration: res.duration || '5s',
          prompt: res.prompt || prompt,
          isSimulated: res.isSimulated,
        });
      } else {
        setError(res.error || 'Video generation failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to generate video');
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    "Scaled Dot-Product Attention matrix multiplication and softmax normalization",
    "Backpropagation gradient chain rule through saturated tanh and sigmoid curves",
    "AlphaFold protein ribbon folding dynamics and hydrogen bond stabilization",
    "Adam optimizer momentum dampening oscillations in high-curvature loss ravines"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Concept Video Generator
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                  gemini-omni-1.1-flash
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Text-to-Video generation using Gemini Omni Flash via the Interactions API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1.5">
                Scientific or Conceptual Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="Describe the educational concept, animation, or diagram you want visualized..."
                className="w-full px-4 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Try prompt:</span>
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(p)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  {p.length > 36 ? p.substring(0, 34) + '...' : p}
                </button>
              ))}
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Aspect Ratio:</span>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('16:9')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      aspectRatio === '16:9'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    16:9 Landscape
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('9:16')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      aspectRatio === '9:16'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    9:16 Shorts
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering Concept (Interactions API)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Video Concept</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Video Player Display */}
          {videoResult && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold">Generated Concept Animation</span>
                  {videoResult.isSimulated && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                      Interactive Visual Simulation
                    </span>
                  )}
                </div>
                <span className="font-mono text-purple-400">{videoResult.duration}</span>
              </div>

              <div className={`mx-auto rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center ${
                aspectRatio === '16:9' ? 'w-full max-w-xl aspect-video' : 'w-64 aspect-[9/16]'
              }`}>
                {videoResult.videoUrl.startsWith('data:video') ? (
                  <video
                    src={videoResult.videoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={videoResult.videoUrl}
                    alt="Educational concept visual"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <p className="text-[11px] text-slate-400 italic text-center">
                "{videoResult.prompt}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
