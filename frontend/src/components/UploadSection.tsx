import React from 'react';
import { FolderClosed, Mail, Loader2, Upload } from 'lucide-react';
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
          className={`flex flex-col items-center justify-center gap-5 w-full aspect-[4/2.5] rounded-[2rem] border transition-all cursor-pointer ${
            file 
              ? 'bg-brand-cyan/5 border-brand-cyan/30 text-brand-cyan' 
              : 'bg-white/5 border-white/10 hover:border-white/20 text-text-dim'
          }`}
        >
          <div className={`p-4 rounded-2xl transition-colors ${file ? 'bg-brand-cyan/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
            <FolderClosed className="w-8 h-8" />
          </div>
          
          <div className="text-center space-y-2">
            <p className={`text-lg font-medium tracking-tight ${file ? 'text-white' : 'text-white/80'}`}>
              {file ? file.name : 'Select a video file'}
            </p>
            <p className="text-sm font-medium opacity-60">
              MP4, AVI, MOV up to 2GB
            </p>
          </div>
        </label>
      </div>

      <div className="space-y-4 pt-2">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-white/40 group-focus-within:text-brand-cyan transition-colors" />
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="Notification email address"
            className="block w-full pl-14 pr-5 py-5 bg-surface-brighter border border-white/5 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/50 transition-all font-medium"
          />
        </div>

        <button
          onClick={onUpload}
          disabled={isUploading || !file || !email}
          className={`w-full py-5 rounded-[1.5rem] font-bold text-lg tracking-wide transition-all flex items-center justify-center gap-3 ${
            isUploading || !file || !email
              ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
              : 'bg-brand-cyan text-surface hover:bg-brand-cyan/90 border border-brand-cyan/50'
          }`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Initializing...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>Transcode Video</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default UploadSection;
