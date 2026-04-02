import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { socket } from './socket';
import { 
  Upload, 
  CheckCircle, 
  Loader2, 
  Play, 
  Mail, 
  ChevronLeft, 
  X, 
  MoreHorizontal, 
  FolderClosed, 
  FolderPlus 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function App() {
  const [email, setEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [processId, setProcessId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('IDLE');
  const [progress, setProgress] = useState(0);
  const [videoData, setVideoData] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

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
        }
      });

      return () => {
        socket.off('status');
        socket.disconnect();
      };
    }
  }, [processId]);

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
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !email) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('video', file);
    formData.append('email', email);

    try {
      const res = await axios.post(`${BACKEND_URL}/api/video/upload`, formData);
      setProcessId(res.data.id);
      window.history.pushState({}, '', `?processId=${res.data.id}`);
    } catch (err) {
      console.error('Upload Error:', err);
      alert('Upload failed');
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F9FA] font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden border border-gray-100"
      >
        {/* Modal Header */}
        <div className="px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            
            <h1 className="text-xl font-bold text-gray-800">Upload New Video</h1>
          </div>
         
        </div>

        {/* Modal Content */}
        <div className="px-8 pb-10">
          <AnimatePresence mode="wait">
            {!processId ? (
              <motion.div
                key="upload-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Dashed Drop Zone */}
                <div className="relative group">
                  <input
                    type="file"
                    id="video-upload"
                    className="hidden"
                    accept="video/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="video-upload"
                    className={`flex flex-col items-center justify-center gap-4 w-full aspect-[4/2.5] rounded-[2rem] border-2 border-dashed transition-all cursor-pointer ${
                      file ? 'bg-blue-50/30 border-blue-400 shadow-inner' : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="relative">
                      <div className="p-4 bg-blue-500/10 rounded-2xl">
                        <FolderClosed className="w-10 h-10 text-blue-600" />
                      </div>
                      {file && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full border-2 border-white" />
                      )}
                    </div>
                    
                    <div className="text-center space-y-1">
                      <p className="text-lg font-bold text-gray-800">
                        {file ? file.name : 'Drag & Drop a file here'}
                      </p>
                      <p className="text-sm font-medium text-gray-400">
                        Files Supported: MP4, AVI, MOV
                      </p>
                    </div>

                    <button 
                      type="button"
                      className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 mt-2"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('video-upload')?.click();
                      }}
                    >
                      <FolderPlus className="w-5 h-5" />
                      Browse
                    </button>

                    <p className="text-xs font-bold text-gray-400 mt-2">Maximum Size: 2Gb</p>
                  </label>
                </div>

                {/* Email Field & Upload Button */}
                <div className="space-y-4 pt-2">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email to receive the results"
                      className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium"
                    />
                  </div>

                  <button
                    onClick={handleUpload}
                    disabled={isUploading || !file || !email}
                    className={`w-full py-5 rounded-[1.5rem] font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${
                      isUploading || !file || !email
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 active:scale-[0.98]'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6" />
                        <span>Start Processing</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="processing-section"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8 py-4"
              >
                {/* Progress Visualizer */}
                <div className="relative aspect-[4/2] rounded-[2rem] bg-gray-900 overflow-hidden shadow-2xl flex items-center justify-center group">
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500 rounded-full filter blur-[60px] animate-pulse-subtle"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-indigo-500 rounded-full filter blur-[60px] animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
                  </div>
                  
                  <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${
                      status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {status === 'COMPLETED' ? (
                        <CheckCircle className="w-10 h-10" />
                      ) : (
                        <Loader2 className="w-10 h-10 animate-spin" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">{getStatusMessage(status)}</h2>
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                        {status === 'COMPLETED' ? 'Finished' : `${progress}% Complete`}
                      </p>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    />
                  </div>
                </div>

                {status === 'COMPLETED' && videoData?.resolutions && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(videoData.resolutions).map(([res, url]) => (
                      <a
                        key={res}
                        href={url as string}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-5 rounded-2xl bg-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-50 rounded-lg text-blue-500 group-hover:bg-blue-100 transition-colors">
                            <Play className="w-5 h-5 fill-current" />
                          </div>
                          <span className="font-bold text-gray-700">{res}</span>
                        </div>
                        <span className="text-xs font-black text-blue-600 px-3 py-1 bg-blue-100/50 rounded-full uppercase tracking-tighter">Download</span>
                      </a>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => {
                    setProcessId(null);
                    setFile(null);
                    setStatus('IDLE');
                    window.history.pushState({}, '', '/');
                  }}
                  className="w-full py-5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-[1.5rem] font-bold text-lg shadow-xl active:scale-[0.98] transition-all"
                >
                  {status === 'COMPLETED' ? 'Process Another Video' : 'Cancel Processing'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default App;
