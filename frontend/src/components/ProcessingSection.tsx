import React from 'react';
import { Loader2, CheckCircle, Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProcessingSectionProps {
  status: string;
  progress: number;
  videoData: any;
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
        onClick={onReset}
        className="w-full py-5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-[1.5rem] font-bold text-lg shadow-xl active:scale-[0.98] transition-all"
      >
        {status === 'COMPLETED' ? 'Process Another Video' : 'Cancel Processing'}
      </button>
    </motion.div>
  );
};

export default ProcessingSection;
