import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, FileText, Loader2 } from 'lucide-react';

interface MediaPreviewModalProps {
  file: File;
  onClose: () => void;
  onSend: (file: File, caption: string) => Promise<void>;
}

const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({ file, onClose, onSend }) => {
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Cleanup to prevent memory leaks
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleSend = async () => {
    if (isSending) return;
    try {
      setIsSending(true);
      await onSend(file, caption.trim());
      // Only close on success
      onClose();
    } catch (err) {
      console.error('Failed to send media:', err);
      alert('Failed to send media: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setIsSending(false);
    }
  };

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col bg-[#0b141a] text-white"
      >
        {/* Header */}
        <div className="flex items-center px-4 py-4 shrink-0">
          <button 
            onClick={onClose}
            disabled={isSending}
            className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Media Preview Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-hidden relative">
          {isImage ? (
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={previewUrl}
              alt="Preview" 
              className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm"
            />
          ) : isVideo ? (
            <motion.video 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={previewUrl} 
              controls 
              className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm bg-black"
            />
          ) : (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center bg-[#111b21] p-10 rounded-2xl border border-white/10 shadow-2xl"
            >
              <div className="w-20 h-20 bg-[#202c33] rounded-full flex items-center justify-center mb-4 text-[#00a884]">
                <FileText size={40} />
              </div>
              <span className="text-xl font-medium max-w-sm text-center break-all">{file.name}</span>
              <span className="text-sm text-white/50 mt-2 font-medium">
                {(file.size / (1024 * 1024)).toFixed(1)} MB • Document
              </span>
            </motion.div>
          )}
        </div>

        {/* Footer Input Area */}
        <div className="shrink-0 p-4 pb-8 flex justify-center bg-[#0b141a]/90 backdrop-blur-md">
          <div className="w-full max-w-2xl flex items-end gap-3 relative">
            <div className="flex-1 bg-[#202c33] rounded-3xl overflow-hidden min-h-[52px] flex">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Type a message"
                disabled={isSending}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1 px-6 py-4 bg-transparent text-[15px] text-white focus:outline-none placeholder:text-white/50 disabled:opacity-50"
              />
            </div>
            
            <motion.button
              onClick={handleSend}
              disabled={isSending}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-[52px] h-[52px] rounded-full bg-[#00a884] flex items-center justify-center text-white shrink-0 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-[#00c99b]"
            >
              {isSending ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <Send size={20} className="ml-1" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MediaPreviewModal;
