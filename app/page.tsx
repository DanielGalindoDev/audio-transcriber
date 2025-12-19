
'use client';

import { useState, useEffect } from 'react';
import { Upload, FileAudio, CheckCircle, AlertCircle, Loader2, Copy, RefreshCw } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Polling logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (jobId && status?.status !== 'completed' && status?.status !== 'failed') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/status?id=${jobId}`);
          if (res.ok) {
            const data = await res.json();
            setStatus(data);
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [jobId, status?.status]);

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!file) return;
    setIsUploading(true);
    setJobId(null);
    setStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setJobId(data.jobId);
      setStatus({ status: 'queued', progress: 0 });
    } catch (e) {
      alert('Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = () => {
    if (status?.result) {
      navigator.clipboard.writeText(status.result);
      alert('Copied to clipboard!');
    }
  };

  return (
    <main>
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>

      <div className="container">
        <div className="text-center mb-8">
          <h1 className="title">Sonic Scribe</h1>
          <p className="subtitle">
            Transcribe hours of audio into text, securely and locally.
            Powered by Whisper.
          </p>
        </div>

        <div className="card">

          {/* Upload Section */}
          {!jobId && (
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
                onChange={handleChange}
                style={{ display: 'none' }}
              />

              <div className="text-center">
                <div className="icon-wrapper">
                  {file ? <FileAudio size={40} /> : <Upload size={40} />}
                </div>

                <div className="mb-4">
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                    {file ? file.name : "Drop audio file here"}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "Support for MP3, WAV, M4A up to 4 hours"}
                  </p>
                </div>

                {file && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      uploadFile();
                    }}
                    disabled={isUploading}
                    className="btn-primary mt-4"
                  >
                    {isUploading ? <Loader2 className="animate-spin" /> : "Start Transcription"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Progress Section */}
          {jobId && status && status.status !== 'completed' && (
            <div className="progress-container py-12">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="circle" strokeDasharray={`${status.progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <text x="18" y="20.35" className="percentage">{Math.round(status.progress)}%</text>
              </svg>

              <div className="text-center">
                <h3 className="mb-2" style={{ fontWeight: 500 }}>
                  {status.status === 'queued' ? 'Queued...' : 'Processing...'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {status.currentChunk ? `Chunk ${status.currentChunk} of ${status.totalChunks}` : 'Preparing audio...'}
                </p>
              </div>
            </div>
          )}

          {/* Result Section */}
          {status && status.status === 'completed' && (
            <div>
              <div className="result-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                  <CheckCircle size={24} />
                  <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>Transcription Complete</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setJobId(null);
                      setFile(null);
                      setStatus(null);
                    }}
                    className="btn-icon"
                    title="Start New"
                  >
                    <RefreshCw size={20} />
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="btn-icon"
                    title="Copy Text"
                  >
                    <Copy size={20} />
                  </button>
                </div>
              </div>

              <div className="result-box">
                {status.result}
              </div>
            </div>
          )}

          {/* Error Section */}
          {status && status.status === 'failed' && (
            <div className="text-center py-12">
              <div style={{ color: 'var(--error)', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <AlertCircle size={48} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.5rem' }}>Validation Failed</h3>
              <div className="error-box">
                {status.error || "An unknown error occurred"}
              </div>
              <br />
              <button
                onClick={() => {
                  setJobId(null);
                  setFile(null);
                  setStatus(null);
                }}
                className="btn-primary mt-6"
                style={{ background: '#334155' }}
              >
                Try Again
              </button>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
