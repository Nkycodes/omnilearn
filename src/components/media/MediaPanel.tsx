import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Music,
  Image as ImageIcon,
  Trash2,
  Eye,
  Mic,
  Square,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { FileMetadata } from '../../types';
import { formatBytes } from '../../utils/studyLogic';
import { FilePreviewModal } from './FilePreviewModal';

interface MediaPanelProps {
  files: FileMetadata[];
  onUpload: (files: File[]) => Promise<void>;
  onDeleteFile: (fileId: string) => Promise<void>;
  isUploading: boolean;
  selectedFileId?: string;
  onSelectFile?: (file: FileMetadata) => void;
}

export const MediaPanel: React.FC<MediaPanelProps> = ({
  files,
  onUpload,
  onDeleteFile,
  isUploading,
  selectedFileId,
  onSelectFile,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [filter, setFilter] = useState<'all' | 'document' | 'audio' | 'image'>('all');
  const [previewFile, setPreviewFile] = useState<FileMetadata | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag-and-drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (selectedFiles: File[]) => {
    setErrorMessage(null);
    try {
      await onUpload(selectedFiles);
    } catch (err: any) {
      setErrorMessage(err.message || 'File upload failed');
    }
  };

  // Audio Recording handlers
  const startRecording = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const recordedFile = new File(
          [audioBlob],
          `Recorded_Lecture_Note_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.mp3`,
          { type: 'audio/mp3' }
        );
        stream.getTracks().forEach((track) => track.stop());
        await handleFiles([recordedFile]);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setErrorMessage('Microphone access denied or unsupported.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const filteredFiles = files.filter((f) =>
    filter === 'all' ? true : f.fileType === filter
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Panel Top Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-wider uppercase text-slate-100">
              Workspace Media
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-indigo-950 border border-indigo-800 text-indigo-300">
              {files.length}
            </span>
          </div>

          {/* Record Lecture Audio Button */}
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg font-medium bg-emerald-950/80 border border-emerald-800 text-emerald-300 hover:bg-emerald-900/80 transition-colors cursor-pointer"
              title="Record live audio from microphone"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Record</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg font-medium bg-rose-950/90 border border-rose-700 text-rose-300 hover:bg-rose-900 transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-rose-300" />
              <span>Stop ({recordingSeconds}s)</span>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 mt-3 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          {(['all', 'document', 'audio', 'image'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-1 text-xs rounded-lg capitalize font-medium transition-colors cursor-pointer text-center ${
                filter === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div className="p-4">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-indigo-400 bg-indigo-950/30 scale-[0.99]'
              : 'border-slate-700 hover:border-slate-500 bg-slate-950/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a,.ogg"
            className="hidden"
            onChange={handleFileInput}
          />
          {isUploading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              <p className="text-xs font-medium text-indigo-300">
                Uploading & indexing into Gemini Multimodal...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-800/40 text-indigo-400">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Drop PDF, audio, or whiteboard photos
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  or <span className="text-indigo-400 underline">browse files</span> from your computer
                </p>
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="flex-1">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* Uploaded Files List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {filteredFiles.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-slate-800 text-slate-400">
            <p className="text-xs font-medium">No {filter !== 'all' ? filter : ''} materials uploaded</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Upload PDF readings, lecture audio, or whiteboard images to synthesize.
            </p>
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isSelected = selectedFileId === file.id;
            return (
              <div
                key={file.id}
                onClick={() => onSelectFile && onSelectFile(file)}
                className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-md'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/80'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      file.fileType === 'document'
                        ? 'bg-blue-950/60 text-blue-400 border border-blue-800/40'
                        : file.fileType === 'audio'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                        : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                    }`}
                  >
                    {file.fileType === 'document' && <FileText className="w-4 h-4" />}
                    {file.fileType === 'audio' && <Music className="w-4 h-4" />}
                    {file.fileType === 'image' && <ImageIcon className="w-4 h-4" />}
                  </div>

                  <div className="overflow-hidden">
                    <p className="text-xs font-medium text-slate-200 truncate max-w-[170px]" title={file.originalName}>
                      {file.originalName}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                      <span className="uppercase font-semibold text-slate-400">{file.fileType}</span>
                      <span>•</span>
                      <span>{formatBytes(file.size)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions: Preview & Delete */}
                <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewFile(file);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title="Preview file"
                    aria-label={`Preview ${file.originalName}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete file"
                    aria-label={`Delete ${file.originalName}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Preview Modal */}
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
};
