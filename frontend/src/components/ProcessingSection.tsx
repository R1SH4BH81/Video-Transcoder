import React from 'react';
import { Loader2, CheckCircle, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export interface VideoData {
  status: string;
  resolutions?: Record<string, string>;
  [key: string]: unknown;
}

interface ProcessingSectionProps {
  status: string;
  progress: number;
  videoData: VideoData | null;
  getStatusMessage: (status: string) => string;
  onReset: () => void;
}

const ProcessingSection: React.FC<ProcessingSectionProps> = ({
  status,
  progress,
  videoData,
  getStatusMessage,
  onReset,
}) => {
  return (
    <motion.div
      key="processing-section"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 py-4"
    >
      {/* Progress Visualizer */}
      <div 
        className="relative aspect-[4/2] rounded-[2rem] bg-surface-brighter overflow-hidden shadow-inner flex items-center justify-center group border border-white/5"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-brand-cyan rounded-full filter blur-[60px] animate-pulse-subtle"></div>
          <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-teal-500 rounded-full filter blur-[60px] animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border transition-colors ${
            status === 'COMPLETED' 
              ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' 
              : 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20'
          }`}>
            {status === 'COMPLETED' ? (
              <CheckCircle className="w-10 h-10" />
            ) : (
              <Loader2 className="w-10 h-10 animate-spin" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1 tracking-tight">{getStatusMessage(status)}</h2>
            <p className="text-sm font-bold text-text-dim uppercase tracking-widest">
              {status === 'COMPLETED' ? 'Finished' : `${progress}% Complete`}
            </p>
          </div>
        </div>

        {/* Progress Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={`h-full transition-colors ${status === 'COMPLETED' ? 'bg-teal-500' : 'bg-brand-cyan shadow-[0_0_15px_rgba(103,232,249,0.5)]'}`}
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
              className="flex items-center justify-between p-5 rounded-2xl bg-surface-brighter border border-white/5 hover:border-brand-cyan/30 hover:bg-white/5 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/5 rounded-lg text-white/50 group-hover:text-brand-cyan transition-colors">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <span className="font-bold text-white/90">{res}</span>
              </div>
              <span className="text-xs font-black text-brand-cyan px-3 py-1 bg-brand-cyan/10 rounded-full uppercase tracking-tighter">Download</span>
            </a>
          ))}
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/5 text-white rounded-[1.5rem] font-bold text-lg transition-all active:scale-[0.98] tracking-wide"
      >
        {status === 'COMPLETED' ? 'Process Another Video' : 'Cancel Processing'}
      </button>
    </motion.div>
  );
};

export default ProcessingSection;
