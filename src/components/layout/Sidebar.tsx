import React, { useState } from 'react';
import {
  FolderPlus,
  Folder,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Workspace } from '../../types';
import { validateWorkspaceTitle } from '../../utils/studyLogic';

interface SidebarProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onSelectWorkspace: (id: string) => void;
  onCreateWorkspace: (title: string, description?: string) => Promise<void>;
  onDeleteWorkspace: (id: string) => Promise<void>;
  onRenameWorkspace: (id: string, newTitle: string) => Promise<void>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
  onRenameWorkspace,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateWorkspaceTitle(newTitle);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Invalid workspace title');
      return;
    }
    setErrorMsg(null);
    await onCreateWorkspace(newTitle.trim(), newDesc.trim());
    setNewTitle('');
    setNewDesc('');
    setIsModalOpen(false);
  };

  const startEditing = (ws: Workspace, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(ws.id);
    setEditTitle(ws.title);
  };

  const saveEditing = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const validation = validateWorkspaceTitle(editTitle);
    if (!validation.valid) return;
    await onRenameWorkspace(id, editTitle.trim());
    setEditingId(null);
  };

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isCollapsed) {
    return (
      <aside className="w-14 h-full bg-slate-950 border-r border-slate-800 flex flex-col items-center py-4 shrink-0 justify-between">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Expand Sidebar"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-colors cursor-pointer"
            title="Create Workspace"
            aria-label="New workspace"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => onSelectWorkspace(ws.id)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                activeWorkspaceId === ws.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={ws.title}
            >
              {ws.title.slice(0, 2).toUpperCase()}
            </button>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 h-full bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Workspaces
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
            title="Create New Project Workspace"
            aria-label="Create workspace"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Collapse Sidebar"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-800/60">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workspaces..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Workspaces List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {filteredWorkspaces.map((ws) => {
          const isActive = activeWorkspaceId === ws.id;
          const isEditing = editingId === ws.id;

          return (
            <div
              key={ws.id}
              onClick={() => onSelectWorkspace(ws.id)}
              className={`group flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-sm'
                  : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                <Folder className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-950 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white w-full"
                    autoFocus
                  />
                ) : (
                  <span className="truncate max-w-[130px] font-medium" title={ws.title}>
                    {ws.title}
                  </span>
                )}
              </div>

              {/* Actions & Badge */}
              <div className="flex items-center gap-1 shrink-0">
                {isEditing ? (
                  <>
                    <button
                      onClick={(e) => saveEditing(ws.id, e)}
                      className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-300 cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {ws.files ? ws.files.length : 0}
                    </span>
                    <button
                      onClick={(e) => startEditing(ws, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-indigo-400 transition-opacity cursor-pointer"
                      title="Rename"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {workspaces.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteWorkspace(ws.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity cursor-pointer"
                        title="Delete workspace"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Workspace Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-slate-100">
                  New Study Workspace
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Workspace Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Organic Chemistry Final Review"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description / Topic Focus
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. Synthesis of reaction mechanisms, lecture 6 audio recording, and exam practice sheets."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-400">{errorMsg}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-md"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
