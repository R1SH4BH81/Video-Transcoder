import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { socket } from './socket';
import { AnimatePresence, motion } from 'framer-motion';

// Components
import UploadSection from './components/UploadSection';
import ProcessingSection from './components/ProcessingSection';
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
  const [videoData, setVideoData] = useState<any>(null);
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
    } catch (err: any) {
      console.error('Upload Error:', err);
      const errorMessage = err.response?.data?.error || 'Upload failed';
      const toastType = err.response?.status === 429 ? 'warning' : 'error';
      addToast(toastType, toastType === 'warning' ? 'Rate Limit Hit' : 'Upload Error', errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Queued for processing...';
      case 'UPLOADING_TO_CDN': return 'Uploading to CDN...';
      case 'PROCESSING': return 'Initializing transcoding...';
      case 'TRANSCODING_360p': return 'Transcoding to 360p...';
      case 'TRANSCODING_480p': return 'Transcoding to 480p...';
      case 'TRANSCODING_720p': return 'Transcoding to 720p...';
      case 'COMPLETED': return 'Transcoding complete!';
      case 'FAILED': return 'Processing failed.';
      default: return 'Processing...';
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F9FA] font-sans">
      <Toaster toasts={toasts} onRemove={removeToast} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden border border-gray-100"
      >
        <div className="px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800">
              {processId ? 'Processing Video' : 'Upload New Video'}
            </h1>
          </div>
        </div>

        <div className="px-8 pb-10">
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
    </div>
  );
}

export default App;
