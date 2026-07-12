'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-custom bg-canvas rounded-2xl shadow-2xl border border-hairline z-10"
        >
          <div className="sticky top-0 z-20 flex justify-between items-center p-4 bg-canvas/80 backdrop-blur-md border-b border-hairline">
            <h2 className="text-body-strong">Post</h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-surface-soft transition-colors"
            >
              <X className="w-5 h-5 text-ink-muted" />
            </button>
          </div>
          
          <div className="p-0">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
