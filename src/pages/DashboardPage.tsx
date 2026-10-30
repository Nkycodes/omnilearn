import React, { useState, useEffect } from 'react';
import { Workspace, FileMetadata, ChatMessage, User } from '../types';
import { workspaceApi, authApi } from '../api/client';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { MediaPanel } from '../components/media/MediaPanel';
import { ChatPanel } from '../components/chat/ChatPanel';
import { KnowledgeSpace3D } from '../components/3d/KnowledgeSpace3D';
import { StudyGuideModal } from '../components/study/StudyGuideModal';
import { QuizModal } from '../components/study/QuizModal';
import { BioscienceExplorerModal } from '../components/science/BioscienceExplorerModal';
import { VideoGeneratorModal } from '../components/video/VideoGeneratorModal';
import { Loader2, AlertCircle } from 'lucide-react';
import { useFirebaseAuth } from '../firebase/authContext';

export const DashboardPage: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [activeView, setActiveView] = useState<'workspace' | '3d'>('workspace');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);

  // Modals
  const [isStudyGuideOpen, setIsStudyGuideOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isScienceOpen, setIsScienceOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState('Scaled Dot-Product Attention matrix multiplication and softmax normalization');
  const [scienceQuery, setScienceQuery] = useState('P04637');
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const { user: fbUser } = useFirebaseAuth();

  // Sync Firebase user with backend if signed in
  useEffect(() => {
    if (fbUser) {
      authApi.syncFirebaseUser({
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || 'Scholar',
        photoURL: fbUser.photoURL || '',
      }).then((res) => {
        if (res.user) {
          setCurrentUser(res.user);
        }
      }).catch((err) => {
        console.warn('Firebase sync with backend notice:', err);
      });
    }
  }, [fbUser]);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    setErrorBanner(null);
    try {
      // Check auth / user
      const user = authApi.getCurrentUser() || {
        id: 'user_demo_scholar',
        email: 'scholar@omnilearn.ai',
        name: 'Scholar Alex',
      };
      setCurrentUser(user);

      // Load workspaces
      const res = await workspaceApi.list();
      if (res.success && res.workspaces.length > 0) {
        setWorkspaces(res.workspaces);
        setActiveWorkspace(res.workspaces[0]);
      } else {
        // Fallback create initial default workspace
        const newWs = await workspaceApi.create({
          title: 'Autonomous Multimodal Workspace',
          description: 'Document, audio, and visual study workspace.',
        });
        if (newWs.success) {
          setWorkspaces([newWs.workspace]);
          setActiveWorkspace(newWs.workspace);
        }
      }
    } catch (err: any) {
      console.error('[Dashboard] Load error:', err);
      // Auto-authenticate as demo if needed
      try {
        const demoAuth = await authApi.login({
          email: 'scholar@omnilearn.ai',
          password: 'password123',
        });
        if (demoAuth.success) {
          setCurrentUser(demoAuth.user || null);
          const listRes = await workspaceApi.list();
          if (listRes.workspaces) {
            setWorkspaces(listRes.workspaces);
            setActiveWorkspace(listRes.workspaces[0] || null);
          }
        }
      } catch {
        setErrorBanner('Failed to load workspaces. Please check connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectWorkspace = async (id: string) => {
    try {
      const res = await workspaceApi.get(id);
      if (res.success) {
        setActiveWorkspace(res.workspace);
        setSelectedFile(null);
      }
    } catch (err: any) {
      setErrorBanner('Failed to switch workspace');
    }
  };

  const handleCreateWorkspace = async (title: string, description?: string) => {
    try {
      const res = await workspaceApi.create({ title, description });
      if (res.success) {
        setWorkspaces((prev) => [res.workspace, ...prev]);
        setActiveWorkspace(res.workspace);
      }
    } catch (err: any) {
      setErrorBanner('Failed to create workspace');
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    try {
      await workspaceApi.delete(id);
      const remaining = workspaces.filter((w) => w.id !== id);
      setWorkspaces(remaining);
      if (activeWorkspace?.id === id) {
        setActiveWorkspace(remaining[0] || null);
      }
    } catch (err: any) {
      setErrorBanner('Failed to delete workspace');
    }
  };

  const handleRenameWorkspace = async (id: string, newTitle: string) => {
    try {
      const res = await workspaceApi.update(id, { title: newTitle });
      if (res.success) {
        setWorkspaces((prev) =>
          prev.map((w) => (w.id === id ? { ...w, title: newTitle } : w))
        );
        if (activeWorkspace?.id === id) {
          setActiveWorkspace((prev) => (prev ? { ...prev, title: newTitle } : null));
        }
      }
    } catch (err: any) {
      setErrorBanner('Failed to rename workspace');
    }
  };

  const handleUploadFiles = async (filesToUpload: File[]) => {
    if (!activeWorkspace) return;
    setIsUploading(true);
    try {
      const res = await workspaceApi.uploadFiles(activeWorkspace.id, filesToUpload);
      if (res.success) {
        setActiveWorkspace(res.workspace);
        setWorkspaces((prev) =>
          prev.map((w) => (w.id === res.workspace.id ? res.workspace : w))
        );
      }
    } catch (err: any) {
      setErrorBanner(err.response?.data?.error || err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!activeWorkspace) return;
    try {
      const res = await workspaceApi.deleteFile(activeWorkspace.id, fileId);
      if (res.success) {
        setActiveWorkspace(res.workspace);
        setWorkspaces((prev) =>
          prev.map((w) => (w.id === res.workspace.id ? res.workspace : w))
        );
        if (selectedFile?.id === fileId) {
          setSelectedFile(null);
        }
      }
    } catch (err: any) {
      setErrorBanner('Failed to delete file');
    }
  };

  const handleSendMessage = async (prompt: string, model?: string, enableGrounding?: boolean) => {
    if (!activeWorkspace || isChatLoading) return;
    setIsChatLoading(true);
    try {
      const res = await workspaceApi.sendChatMessage(
        activeWorkspace.id,
        prompt,
        undefined,
        model,
        enableGrounding
      );
      if (res.success) {
        setActiveWorkspace(res.workspace);
        setWorkspaces((prev) =>
          prev.map((w) => (w.id === res.workspace.id ? res.workspace : w))
        );
      }
    } catch (err: any) {
      setErrorBanner(err.response?.data?.error || err.message || 'Failed to send message');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerateStudyGuide = async () => {
    if (!activeWorkspace) return;
    setIsGeneratingGuide(true);
    try {
      const res = await workspaceApi.generateStudyGuide(activeWorkspace.id);
      if (res.success) {
        setActiveWorkspace((prev) =>
          prev ? { ...prev, studyGuide: res.studyGuide } : null
        );
      }
    } catch (err: any) {
      setErrorBanner(err.response?.data?.error || 'Study guide generation failed');
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    window.location.href = '/login';
  };

  const handleOpenVideo = (promptText?: string) => {
    if (promptText) setVideoPrompt(promptText);
    setIsVideoOpen(true);
  };

  const handleOpenScience = (query?: string) => {
    if (query) setScienceQuery(query);
    setIsScienceOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-300">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-wider">
          Initializing Multimodal Neural Engine...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* Top Navigation */}
      <Navbar
        currentWorkspace={activeWorkspace}
        currentUser={currentUser}
        onLogout={handleLogout}
        activeView={activeView}
        onToggleView={setActiveView}
        onOpenStudyGuide={() => {
          setIsStudyGuideOpen(true);
          if (!activeWorkspace?.studyGuide) {
            handleGenerateStudyGuide();
          }
        }}
        onOpenQuiz={() => setIsQuizOpen(true)}
        onOpenScienceExplorer={() => handleOpenScience()}
        onOpenVideoGenerator={() => handleOpenVideo()}
      />

      {/* Error Alert Banner */}
      {errorBanner && (
        <div className="px-4 py-2 bg-rose-950/90 border-b border-rose-800 text-rose-200 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{errorBanner}</span>
          </div>
          <button
            onClick={() => setErrorBanner(null)}
            className="text-rose-300 hover:text-white font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspace?.id || null}
          onSelectWorkspace={handleSelectWorkspace}
          onCreateWorkspace={handleCreateWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          onRenameWorkspace={handleRenameWorkspace}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Center Content Area */}
        <main className="flex-1 flex overflow-hidden relative">
          {activeView === 'workspace' ? (
            /* Split Workspace View: Left Media Panel (35%), Right Chat Panel (65%) */
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 h-full overflow-hidden">
              <div className="md:col-span-4 xl:col-span-3 h-full overflow-hidden">
                <MediaPanel
                  files={activeWorkspace?.files || []}
                  onUpload={handleUploadFiles}
                  onDeleteFile={handleDeleteFile}
                  isUploading={isUploading}
                  selectedFileId={selectedFile?.id}
                  onSelectFile={setSelectedFile}
                />
              </div>

              <div className="md:col-span-8 xl:col-span-9 h-full overflow-hidden">
                <ChatPanel
                  messages={activeWorkspace?.chatHistory || []}
                  files={activeWorkspace?.files || []}
                  onSendMessage={handleSendMessage}
                  isLoading={isChatLoading}
                  onOpenStudyGuide={() => {
                    setIsStudyGuideOpen(true);
                    if (!activeWorkspace?.studyGuide) {
                      handleGenerateStudyGuide();
                    }
                  }}
                  onOpenQuiz={() => setIsQuizOpen(true)}
                  onOpenVideoGenerator={handleOpenVideo}
                  onOpenScienceExplorer={handleOpenScience}
                />
              </div>
            </div>
          ) : (
            /* Full-Bleed 3D Multimodal Knowledge Space View */
            <div className="w-full h-full relative">
              <KnowledgeSpace3D
                files={activeWorkspace?.files || []}
                selectedFile={selectedFile}
                onSelectFile={setSelectedFile}
              />
            </div>
          )}
        </main>
      </div>

      {/* Study Guide Modal */}
      <StudyGuideModal
        isOpen={isStudyGuideOpen}
        onClose={() => setIsStudyGuideOpen(false)}
        studyGuideText={activeWorkspace?.studyGuide || null}
        workspaceTitle={activeWorkspace?.title || 'OmniLearn Project'}
        onRegenerate={handleGenerateStudyGuide}
        isGenerating={isGeneratingGuide}
      />

      {/* Practice Quiz Modal */}
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        workspaceTitle={activeWorkspace?.title || 'OmniLearn Project'}
        files={activeWorkspace?.files || []}
      />

      {/* Bioscience Explorer Modal (AlphaFold DB, UniProt, PubChem, PubMed) */}
      <BioscienceExplorerModal
        isOpen={isScienceOpen}
        onClose={() => setIsScienceOpen(false)}
        initialQuery={scienceQuery}
      />

      {/* Concept Video Generator Modal (gemini-omni-1.1-flash) */}
      <VideoGeneratorModal
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        initialPrompt={videoPrompt}
      />
    </div>
  );
};
