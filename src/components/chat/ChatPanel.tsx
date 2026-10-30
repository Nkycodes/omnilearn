import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  Copy,
  Check,
  Volume2,
  FileText,
  Music,
  Image as ImageIcon,
  BookOpen,
  HelpCircle,
  RotateCcw,
  Loader2,
  Globe,
  Video,
  Dna,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { ChatMessage, FileMetadata } from '../../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  files: FileMetadata[];
  onSendMessage: (prompt: string, model?: string, enableGrounding?: boolean) => Promise<void>;
  isLoading: boolean;
  onOpenStudyGuide?: () => void;
  onOpenQuiz?: () => void;
  onOpenVideoGenerator?: (prompt: string) => void;
  onOpenScienceExplorer?: (query?: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  files,
  onSendMessage,
  isLoading,
  onOpenStudyGuide,
  onOpenQuiz,
  onOpenVideoGenerator,
  onOpenScienceExplorer,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tutorModel, setTutorModel] = useState<'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  const [enableGrounding, setEnableGrounding] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const prompt = inputText;
    setInputText('');
    await onSendMessage(prompt, tutorModel, enableGrounding);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#`_>-]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const suggestedPrompts = [
    "Synthesize the reading PDF with the lecture audio points",
    "Identify 3 potential exam questions based on my whiteboard photo",
    "Explain key mathematical formulas and their intuition",
    "Generate a summary of the most confusing concepts"
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Top Context & Action Bar */}
      <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-indigo-950/70 text-indigo-400 border border-indigo-800/40">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">
              Multimodal Synthesis Chat
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Model Tier:</span>
              <select
                value={tutorModel}
                onChange={(e) => setTutorModel(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-md px-2 py-0.5 text-[11px] text-indigo-300 font-semibold focus:outline-none"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (Synthesizer)</option>
                <option value="gemini-4-argon">gemini-4-argon (Master Professor)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Speed Quizzer)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Tools & Grounding Toggle */}
        <div className="flex items-center gap-2">
          {/* Search Grounding toggle */}
          <button
            type="button"
            onClick={() => setEnableGrounding(!enableGrounding)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
              enableGrounding
                ? 'bg-blue-950/80 text-blue-300 border-blue-700 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Search Grounding with Google Search Data"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>Search Grounding</span>
            <span className={`w-2 h-2 rounded-full ${enableGrounding ? 'bg-blue-400' : 'bg-slate-600'}`} />
          </button>

          {onOpenVideoGenerator && (
            <button
              onClick={() => onOpenVideoGenerator('Multimodal concept flow animation')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-xl bg-purple-950/70 hover:bg-purple-900/80 text-purple-300 border border-purple-800 transition-colors cursor-pointer"
              title="Generate Video with gemini-omni-1.1-flash"
            >
              <Video className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Concept Video</span>
            </button>
          )}

          {onOpenScienceExplorer && (
            <button
              onClick={() => onOpenScienceExplorer('P04637')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800 transition-colors cursor-pointer"
              title="AlphaFold, UniProt, PubChem & PubMed"
            >
              <Dna className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Science Hub</span>
            </button>
          )}

          {onOpenStudyGuide && (
            <button
              onClick={onOpenStudyGuide}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guide</span>
            </button>
          )}

          {onOpenQuiz && (
            <button
              onClick={onOpenQuiz}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-900/60 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quiz</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isSystem = msg.role === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-3">
                <div className="px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>{msg.content}</span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`flex flex-col max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 ${
                  isUser
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 shadow-sm'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-white/10 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tracking-wide">
                      {isUser ? 'You' : 'OmniLearn AI'}
                    </span>
                    {!isUser && msg.modelUsed && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {msg.modelUsed}
                      </span>
                    )}
                  </div>
                  <span className="text-white/60">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message Body */}
                <div className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-sans space-y-2">
                  {msg.content}
                </div>

                {/* Google Search Grounding Sources */}
                {!isUser && msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                      <Globe className="w-3 h-3" />
                      <span>Google Search Grounding Sources:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {msg.groundingSources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded-md text-[10px] bg-blue-950/40 hover:bg-blue-900/60 border border-blue-900 text-blue-300 flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[200px]">{source.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Referenced files pills */}
                {msg.referencedFiles && msg.referencedFiles.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Files:
                    </span>
                    {msg.referencedFiles.map((fn, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-950/80 border border-slate-800 text-indigo-300"
                      >
                        {fn}
                      </span>
                    ))}
                  </div>
                )}

                {/* Assistant Footer Actions: Copy, Read aloud, Generate Video */}
                {!isUser && (
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-slate-400">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        title="Copy to clipboard"
                        aria-label="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleSpeak(msg.content)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        title="Listen to explanation"
                        aria-label="Read explanation aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>

                      {onOpenVideoGenerator && (
                        <button
                          onClick={() => onOpenVideoGenerator(msg.content.substring(0, 150))}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800 flex items-center gap-1 transition-colors cursor-pointer ml-1"
                          title="Generate concept video from this explanation"
                        >
                          <Video className="w-3 h-3 text-purple-400" />
                          <span>Visualize Video</span>
                        </button>
                      )}
                    </div>

                    {msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                      <div className="flex items-center gap-1 overflow-x-auto py-1">
                        {msg.suggestedFollowups.slice(0, 2).map((followup, idx) => (
                          <button
                            key={idx}
                            onClick={() => onSendMessage(followup, tutorModel, enableGrounding)}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/50 transition-colors truncate max-w-[180px] cursor-pointer"
                            title={followup}
                          >
                            + {followup}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-indigo-700 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex gap-3.5 justify-start">
            <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400 shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-5 py-4 flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              <p className="text-xs text-slate-300">
                {tutorModel} is synthesizing across documents, recordings, and visual diagrams...
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Pill Tray */}
      <div className="px-6 py-2 border-t border-slate-800/60 bg-slate-900/40 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider shrink-0">
          Try Prompt:
        </span>
        {suggestedPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(p, tutorModel, enableGrounding)}
            disabled={isLoading}
            className="text-[11px] whitespace-nowrap px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer shrink-0 disabled:opacity-40"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-900/80">
        <div className="relative flex items-center">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={`Ask ${tutorModel} about your materials (e.g., "Connect the audio at 14:00 with equation 3 in the paper")...`}
            rows={2}
            className="w-full pl-4 pr-12 py-2.5 text-xs md:text-sm bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2.5 bottom-2.5 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md"
            title="Send Message"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
