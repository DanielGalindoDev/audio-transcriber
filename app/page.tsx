
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Upload, FileAudio, CheckCircle, AlertCircle, Loader2, Copy, RefreshCw, Trash2, Download, Clock } from 'lucide-react';

interface Job {
  id: string;
  filename: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentChunk?: number;
  totalChunks?: number;
  result?: string;
  error?: string;
  createdAt: number;
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Fetch Jobs
  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (e) {
      console.error("Error fetching jobs", e);
    }
  }, []);

  // Initial fetch and Polling
  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 2000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    setIsUploading(true);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      setFiles([]); // Clear selection
      fetchJobs();  // Refresh list immediately
    } catch (e) {
      alert('Error uploading files');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteJob = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this job and its files?')) return;

    try {
      await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
      fetchJobs();
    } catch (e) {
      alert('Failed to delete job');
    }
  };

  const downloadJob = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/api/jobs/${id}/download`, '_blank');
  };

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-emerald-400" size={20} />;
      case 'failed': return <AlertCircle className="text-rose-500" size={20} />;
      case 'processing': return <Loader2 className="animate-spin text-blue-400" size={20} />;
      default: return <Clock className="text-slate-400" size={20} />;
    }
  };

  return (
    <main className="min-h-screen py-12 px-4 selection:bg-purple-500/30">
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>

      <div className="container max-w-4xl mx-auto z-10 relative">
        <div className="text-center mb-12">
          <h1 className="title text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
            Sonic Scribe
          </h1>
          <p className="subtitle text-lg text-slate-300">
            Batch Audio Transcription Queue
          </p>
        </div>

        {/* Upload Card */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4 text-slate-200">New Transcription</h2>
          <div
            className={`upload-area ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept="audio/*"
              multiple // Allow multiple
              onChange={handleChange}
              style={{ display: 'none' }}
            />

            <div className="text-center">
              <div className="icon-wrapper mb-4">
                {files.length > 0 ? <FileAudio size={40} /> : <Upload size={40} />}
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-medium mb-1 text-slate-200">
                  {files.length > 0
                    ? `${files.length} file(s) selected`
                    : "Drop audio files here"}
                </h3>
                <p className="text-sm text-slate-400">
                  {files.length > 0
                    ? files.map(f => f.name).join(', ')
                    : "Support for multiple MP3, WAV, M4A files"}
                </p>
              </div>

              {files.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    uploadFiles();
                  }}
                  disabled={isUploading}
                  className="btn-primary mt-4"
                >
                  {isUploading ? <Loader2 className="animate-spin" /> : `AddTo Queue (${files.length})`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4 text-slate-200 flex items-center gap-2">
            Queue Dashboard
            <span className="text-sm font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
              {jobs.length}
            </span>
          </h2>

          {jobs.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
              No jobs in queue. Upload some audio!
            </div>
          )}

          {jobs.map(job => (
            <div key={job.id} className="card p-4 flex items-center gap-4 transition-all hover:border-slate-600 group">
              {/* Icon */}
              <div className={`p-3 rounded-full bg-slate-800/50 border border-slate-700`}>
                {getStatusIcon(job.status)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium truncate pr-4 text-slate-200" title={job.filename}>
                    {job.filename}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold 
                    ${job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      job.status === 'processing' ? 'bg-blue-500/10 text-blue-400' :
                        job.status === 'failed' ? 'bg-rose-500/10 text-rose-500' :
                          'bg-slate-500/10 text-slate-400'}`}>
                    {job.status}
                  </span>
                </div>

                {/* Progress Bar for Processing */}
                {job.status === 'processing' && (
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-500 ease-out"
                      style={{ width: `${job.progress}%` }}
                    />
                    <div className="text-xs text-slate-400 mt-1 flex justify-between">
                      <span>Chunk {job.currentChunk}/{job.totalChunks || '?'}</span>
                      <span>{Math.round(job.progress)}%</span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {job.status === 'failed' && (
                  <p className="text-xs text-rose-400 mt-1 truncate">{job.error}</p>
                )}

                {/* Queue Info */}
                {job.status === 'queued' && (
                  <p className="text-xs text-slate-500 mt-1">Waiting in line...</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
                {job.status === 'completed' && (
                  <button
                    onClick={(e) => downloadJob(job.id, e)}
                    className="btn-icon success"
                    title="Download Transcript"
                  >
                    <Download size={20} />
                  </button>
                )}

                <button
                  onClick={(e) => deleteJob(job.id, e)}
                  className="btn-icon danger"
                  title="Delete Job"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
