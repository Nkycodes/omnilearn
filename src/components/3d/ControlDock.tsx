import React, { useState } from 'react';
import { Camera, Layers, Activity, Filter, ChevronDown, ChevronUp, Eye } from 'lucide-react';

interface ControlDockProps {
  viewPreset: 'core' | 'orbit' | 'top';
  onSelectView: (view: 'core' | 'orbit' | 'top') => void;
  separation: number;
  onSeparationChange: (val: number) => void;
  rotationSpeed: number;
  onRotationSpeedChange: (val: number) => void;
  activeFilter: 'all' | 'document' | 'audio' | 'image';
  onFilterChange: (filter: 'all' | 'document' | 'audio' | 'image') => void;
  nodeCount: number;
  selectedNodeTitle?: string;
  onResetSelection?: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  viewPreset,
  onSelectView,
  separation,
  onSeparationChange,
  rotationSpeed,
  onRotationSpeedChange,
  activeFilter,
  onFilterChange,
  nodeCount,
  selectedNodeTitle,
  onResetSelection,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: isCollapsed ? '-130px' : '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: 'min(940px, 94vw)',
        width: '100%',
        zIndex: 20,
        transition: 'bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="flex flex-col items-center pointer-events-auto"
    >
      {/* Collapse / Expand Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? 'Show 3D scene controls' : 'Hide 3D scene controls'}
        className="mb-1.5 flex items-center gap-1.5 px-3 py-1 text-xs font-medium tracking-wide uppercase text-slate-300 bg-slate-900 border border-slate-700/80 rounded-full hover:bg-slate-800 transition-colors cursor-pointer shadow-lg"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>Show Dock</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Hide Dock (H)</span>
          </>
        )}
      </button>

      {/* Main Bottom Dock Panel - solid surface to prevent software WebGL stalling */}
      <div className="w-full bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl text-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Active Node Info & Count */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Knowledge Space
              </span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-300 font-mono">
              {nodeCount} Nodes
            </span>
            {selectedNodeTitle && (
              <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded">
                <Eye className="w-3 h-3" />
                <span className="max-w-[140px] truncate">{selectedNodeTitle}</span>
                {onResetSelection && (
                  <button
                    onClick={onResetSelection}
                    className="text-amber-400 hover:text-amber-200 text-[10px] ml-1 underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Camera View Presets */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onSelectView('core')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                viewPreset === 'core'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Core
            </button>
            <button
              onClick={() => onSelectView('orbit')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                viewPreset === 'orbit'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Orbit
            </button>
            <button
              onClick={() => onSelectView('top')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                viewPreset === 'top'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Top View
            </button>
          </div>

          {/* Modality Filter */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 px-1.5 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-500" />
            </span>
            {(['all', 'document', 'audio', 'image'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => onFilterChange(filter)}
                className={`px-2 py-0.5 text-xs rounded-md capitalize transition-colors cursor-pointer ${
                  activeFilter === filter
                    ? 'bg-indigo-600/90 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Sliders for Exploded Separation & Rotation */}
          <div className="flex items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Separation</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={separation}
                onChange={(e) => onSeparationChange(parseFloat(e.target.value))}
                className="w-20 accent-indigo-500 cursor-pointer"
                aria-label="Separation distance slider"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Spin</span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.2"
                value={rotationSpeed}
                onChange={(e) => onRotationSpeedChange(parseFloat(e.target.value))}
                className="w-16 accent-indigo-500 cursor-pointer"
                aria-label="Rotation speed slider"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
