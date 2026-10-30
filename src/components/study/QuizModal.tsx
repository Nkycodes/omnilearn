import React, { useState } from 'react';
import { X, HelpCircle, CheckCircle, AlertTriangle, RotateCcw, Trophy, ArrowRight } from 'lucide-react';
import { QuizQuestion, calculateQuizScore } from '../../utils/studyLogic';
import { FileMetadata } from '../../types';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceTitle: string;
  files: FileMetadata[];
}

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  workspaceTitle,
  files,
}) => {
  // Pre-configured dynamic questions matching workspace themes
  const sampleQuestions: QuizQuestion[] = [
    {
      question: "In high-dimensional backpropagation, why is the full Jacobian matrix rarely instantiated in GPU memory?",
      options: [
        "Because GPUs can only compute scalar additions.",
        "Because it would require gigabytes of VRAM; instead we compute iterative vector-Jacobian products directly.",
        "Because automatic differentiation cannot differentiate non-convex functions.",
        "Because modern neural networks do not employ the chain rule."
      ],
      correctAnswer: 1,
      explanation: "As highlighted in the lecture audio and paper, computing the full Jacobian matrix of size (M x N) for millions of weights consumes prohibitive memory, whereas vector-Jacobian products evaluate in linear time/memory."
    },
    {
      question: "According to the whiteboard schematic, how does Scaled Dot-Product Attention prevent vanishing gradients in Softmax?",
      options: [
        "By dividing the dot products by the square root of key dimension sqrt(d_k).",
        "By setting all negative weights to zero using a ReLU activation.",
        "By removing the Key and Value matrices completely.",
        "By enforcing integer rounding on intermediate dot-products."
      ],
      correctAnswer: 0,
      explanation: "Dividing by sqrt(d_k) prevents the dot products from growing excessively large, keeping softmax gradients out of the saturated, near-zero slope regions."
    },
    {
      question: "How does the Adam optimizer resolve oscillations when traversing high-curvature ravines compared to standard SGD?",
      options: [
        "By resetting learning rates to zero at each epoch.",
        "By incorporating an exponential moving average of both the first and second uncentered gradient moments.",
        "By switching to genetic algorithms during divergence.",
        "By using second-order Hessian inversion."
      ],
      correctAnswer: 1,
      explanation: "Adam combines momentum (first moment) with RMSprop-style adaptive learning rates (second uncentered moment) to accelerate along flat directions and dampen high-curvature perpendicular oscillations."
    }
  ];

  const [questions, setQuestions] = useState<QuizQuestion[]>(sampleQuestions);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  if (!isOpen) return null;

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleReset = () => {
    setUserAnswers({});
    setIsSubmitted(false);
    setCurrentIdx(0);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const results = calculateQuizScore(userAnswers, questions);
  const currentQ = questions[currentIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-950/70 border border-indigo-800/60 text-indigo-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Multimodal Practice Quiz
              </h2>
              <p className="text-xs text-slate-400">
                {questions.length} questions derived from {files.length} material(s)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
            aria-label="Close quiz modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quiz Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-950/40 text-slate-200">
          {!isSubmitted ? (
            <div>
              {/* Question Navigation Chips */}
              <div className="flex items-center gap-2 mb-6">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      currentIdx === idx
                        ? 'bg-indigo-600 text-white shadow'
                        : userAnswers[idx] !== undefined
                        ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {/* Current Question */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block mb-2">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <p className="text-sm font-medium text-slate-100 leading-relaxed">
                  {currentQ.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = userAnswers[currentIdx] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(currentIdx, optIdx)}
                      className={`w-full text-left p-4 rounded-xl border text-xs md:text-sm font-medium transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-indigo-950/70 border-indigo-500 text-white shadow'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-xs font-mono">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="flex-1 mt-0.5">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-800">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors cursor-pointer"
                >
                  Previous
                </button>

                {currentIdx < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={Object.keys(userAnswers).length === 0}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors cursor-pointer shadow-md"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Submit & Score Quiz</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Results Screen */
            <div className="space-y-6">
              <div className="text-center p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-indigo-950/80 border border-indigo-700 mx-auto flex items-center justify-center text-indigo-400 mb-3">
                  <Trophy className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">
                  Quiz Completed!
                </h3>
                <p className="text-2xl font-mono font-bold text-indigo-400 mt-1">
                  {results.score} / {results.total} ({results.percentage}%)
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {results.passed
                    ? '🎉 Excellent understanding of the multimodal lecture concepts!'
                    : 'Review the explanations below and re-listen to the lecture track.'}
                </p>
              </div>

              {/* Question by Question Review */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Detailed Answer Review:
                </h4>
                {questions.map((q, idx) => {
                  const userChoice = userAnswers[idx];
                  const isCorrect = userChoice === q.correctAnswer;
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border ${
                        isCorrect
                          ? 'bg-emerald-950/20 border-emerald-800/60'
                          : 'bg-rose-950/20 border-rose-800/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold text-slate-200">
                          {idx + 1}. {q.question}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isCorrect ? 'bg-emerald-900 text-emerald-300' : 'bg-rose-900 text-rose-300'
                          }`}
                        >
                          {isCorrect ? 'CORRECT' : 'INCORRECT'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 space-y-1 mb-2">
                        <p>
                          <span className="text-slate-400">Your Answer:</span>{' '}
                          {userChoice !== undefined ? q.options[userChoice] : 'Not answered'}
                        </p>
                        {!isCorrect && (
                          <p className="text-emerald-400">
                            <span className="text-slate-400">Correct Answer:</span>{' '}
                            {q.options[q.correctAnswer]}
                          </p>
                        )}
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
                        <span className="font-semibold text-indigo-300">Explanation:</span>{' '}
                        {q.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
