import React from 'react';
import { FolderClosed, FolderPlus, Mail, Loader2, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

interface UploadSectionProps {
  file: File | null;
  email: string;
  isUploading: boolean;
  onFileChange: (file: File | null) => void;
  onEmailChange: (email: string) => void;
  onUpload: (e: React.FormEvent) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({
  file,
  email,
  isUploading,
  onFileChange,
  onEmailChange,
  onUpload,
}) => {
  return (
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
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
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
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="Enter your email to receive the results"
            className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium"
          />
        </div>

        <button
          onClick={onUpload}
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
  );
};

export default UploadSection;
