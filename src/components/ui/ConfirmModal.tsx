import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OctagonAlert, Check, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Proses Sekarang',
  cancelText = 'Batal',
  type = 'warning'
}) => {
  const colors = {
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-600',
      icon: 'text-red-500',
      btn: 'bg-red-600 hover:bg-red-700 shadow-red-200',
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-600',
      icon: 'text-orange-500',
      btn: 'bg-primary hover:bg-primary-dark shadow-primary/20 text-black',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-600',
      icon: 'text-blue-500',
      btn: 'bg-black hover:bg-gray-800 shadow-gray-200 text-white',
    }
  };

  const activeColor = colors[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full max-w-md bg-white rounded-[2.5rem] border-4 border-black shadow-[15px_15px_0px_0px_#000] overflow-hidden`}
          >
            <div className={`p-8 space-y-6`}>
              <div className="flex justify-between items-start">
                <div className={`w-16 h-16 rounded-2xl ${activeColor.bg} border-2 ${activeColor.border} flex items-center justify-center`}>
                  <OctagonAlert className={activeColor.icon} size={32} />
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-black uppercase tracking-tight">{title}</h3>
                <p className="text-sm font-bold text-text-muted leading-relaxed">{message}</p>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 px-6 rounded-2xl border-2 border-gray-100 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${activeColor.btn}`}
                >
                  <Check size={18} />
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
