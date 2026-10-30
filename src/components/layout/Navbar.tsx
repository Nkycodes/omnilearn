import React from 'react';
import {
  Brain,
  Layers,
  Box,
  BookOpen,
  HelpCircle,
  LogOut,
  Sparkles,
  User as UserIcon,
  ChevronRight,
  Dna,
  Video,
  ShieldCheck
} from 'lucide-react';
import { User, Workspace } from '../../types';
import { useFirebaseAuth } from '../../firebase/authContext';

interface NavbarProps {
  currentWorkspace: Workspace | null;
  currentUser: User | null;
  onLogout: () => void;
  activeView: 'workspace' | '3d';
  onToggleView: (view: 'workspace' | '3d') => void;
  onOpenStudyGuide: () => void;
  onOpenQuiz: () => void;
  onOpenScienceExplorer?: () => void;
  onOpenVideoGenerator?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentWorkspace,
  currentUser,
  onLogout,
  activeView,
  onToggleView,
  onOpenStudyGuide,
  onOpenQuiz,
  onOpenScienceExplorer,
  onOpenVideoGenerator,
}) => {
  const { user: fbUser, signInWithGoogle, signOut: fbSignOut } = useFirebaseAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google Sign-in failed:', err);
    }
  };

  const activeUser = fbUser || currentUser;

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between shrink-0 z-30">
      {/* Brand & Workspace breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md">
            <Brain className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm md:text-base tracking-tight text-slate-100 hidden sm:inline">
            Omni<span className="text-indigo-400">Learn</span>
          </span>
        </div>

        {currentWorkspace && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-200 truncate max-w-[140px] md:max-w-xs">
              {currentWorkspace.title}
            </span>
          </div>
        )}
      </div>

      {/* Center View Mode Switcher: Workspace vs 3D Knowledge Hub */}
      <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => onToggleView('workspace')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            activeView === 'workspace'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Workspace</span>
        </button>
        <button
          onClick={() => onToggleView('3d')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            activeView === '3d'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-3.5 h-3.5 text-indigo-300" />
          <span>3D Knowledge Space</span>
        </button>
      </div>

      {/* Right Action Tools: Science, Video, Guide, Quiz, Profile */}
      <div className="flex items-center gap-2">
        {onOpenScienceExplorer && (
          <button
            onClick={onOpenScienceExplorer}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800 transition-colors cursor-pointer"
            title="AlphaFold, UniProt, PubChem & PubMed"
          >
            <Dna className="w-3.5 h-3.5 text-cyan-400" />
            <span>Science</span>
          </button>
        )}

        {onOpenVideoGenerator && (
          <button
            onClick={onOpenVideoGenerator}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800 transition-colors cursor-pointer"
            title="Generate Concept Video (gemini-omni-1.1-flash)"
          >
            <Video className="w-3.5 h-3.5 text-purple-400" />
            <span>Video</span>
          </button>
        )}

        <button
          onClick={onOpenStudyGuide}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          title="Open Study Guide"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>Guide</span>
        </button>

        <button
          onClick={onOpenQuiz}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          title="Practice Quiz"
        >
          <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Quiz</span>
        </button>

        {/* User Badge / Google Auth */}
        {activeUser ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            {fbUser?.photoURL ? (
              <img
                src={fbUser.photoURL}
                alt={fbUser.displayName || 'User'}
                className="w-7 h-7 rounded-lg border border-indigo-700 object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-700 flex items-center justify-center text-indigo-300 text-xs font-bold uppercase">
                {fbUser?.displayName?.[0] || currentUser?.name?.[0] || 'U'}
              </div>
            )}
            <button
              onClick={() => {
                if (fbUser) fbSignOut();
                onLogout();
              }}
              className="p-1.5 rounded-lg hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleGoogleSignIn}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-sm"
          >
            <span>Google Sign-In</span>
          </button>
        )}
      </div>
    </header>
  );
};
