import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { socket } from './socket';
import { AnimatePresence, motion } from 'framer-motion';


import { getStatusMessage } from './utils/statusHelper';

// Components
import UploadSection from './components/UploadSection';
import ProcessingSection from './components/ProcessingSection';
import type { VideoData } from './components/ProcessingSection';
import Toaster from './components/Toaster';
import type { ToastData } from './components/Toaster';
import type { ToastType } from './components/Toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function App() {
  const [email, setEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [processId, setProcessId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('IDLE');
  const [progress, setProgress] = useState(0);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((type: ToastType, message: string, subText?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message, subText }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('processId');
    if (id) {
      setProcessId(id);
      fetchStatus(id);
    }
  }, []);

  useEffect(() => {
    if (processId) {
      socket.connect();
      socket.emit('join', processId);

      socket.on('status', (data) => {
        setStatus(data.status);
        setProgress(data.progress);
        if (data.status === 'COMPLETED') {
          fetchStatus(processId);
          addToast('success', 'Processing Complete!', 'Your video is ready for download.');
        } else if (data.status === 'FAILED') {
          addToast('error', 'Processing Failed', 'There was an error transcoding your video.');
        }
      });

      return () => {
        socket.off('status');
        socket.disconnect();
      };
    }
  }, [processId, addToast]);

  const fetchStatus = async (id: string) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/video/status/${id}`);
      setVideoData(res.data);
      setStatus(res.data.status);
      if (res.data.status === 'COMPLETED') {
        setProgress(100);
      }
    } catch (err) {
      console.error('Fetch Status Error:', err);
      addToast('error', 'Update Failed', 'Could not refresh video status.');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !email) return;

    setIsUploading(true);
    addToast('info', 'Starting Upload', 'Your video is being sent to the server...');

    const formData = new FormData();
    formData.append('video', file);
    formData.append('email', email);

    try {
      const res = await axios.post(`${BACKEND_URL}/api/video/upload`, formData);
      setProcessId(res.data.id);
      window.history.pushState({}, '', `?processId=${res.data.id}`);
      addToast('success', 'Upload Successful', 'Video processing has started.');
    } catch (err: unknown) {
      console.error('Upload Error:', err);
      let errorMessage = 'Upload failed';
      let toastType: ToastType = 'error';

      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.error || errorMessage;
        toastType = err.response?.status === 429 ? 'warning' : 'error';
      }
      
      addToast(toastType, toastType === 'warning' ? 'Rate Limit Hit' : 'Upload Error', errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const resetProcess = () => {
    setProcessId(null);
    setFile(null);
    setStatus('IDLE');
    setProgress(0);
    window.history.pushState({}, '', '/');
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-bg-main font-sans selection:bg-brand-cyan/30">
      <Toaster toasts={toasts} onRemove={removeToast} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl bg-surface rounded-[3rem] shadow-premium overflow-hidden border border-white/5 relative"
      >
        {/* Subtle Gradient Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-cyan/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="px-10 py-8 flex items-center justify-between relative z-10">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black tracking-tight text-white/90">
              {processId ? 'Processing' : 'Transcoder'}
            </h1>
            <p className="text-xs font-bold text-text-dim uppercase tracking-[0.2em]">
              {processId ? 'High Resolution Queue' : 'Upload Studio'}
            </p>
          </div>
          
          {processId && (
            <button 
              onClick={resetProcess}
              className="text-xs font-bold text-text-dim hover:text-white transition-colors uppercase tracking-wider px-4 py-2 rounded-full bg-white/5 border border-white/5"
            >
              New Job
            </button>
          )}
        </div>

        <div className="px-10 pb-12 relative z-10">
          <AnimatePresence mode="wait">
            {!processId ? (
              <UploadSection
                file={file}
                email={email}
                isUploading={isUploading}
                onFileChange={setFile}
                onEmailChange={setEmail}
                onUpload={handleUpload}
              />
            ) : (
              <ProcessingSection
                status={status}
                progress={progress}
                videoData={videoData}
                getStatusMessage={getStatusMessage}
                onReset={resetProcess}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  );
}

export default App;
