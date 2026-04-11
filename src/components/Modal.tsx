import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  confirmColor?: string;
  disabled?: boolean;
  children?: ReactNode;
}

export function Modal({ 
  isOpen, 
  title, 
  onClose, 
  onConfirm, 
  confirmText = 'Confirm', 
  confirmColor = 'bg-[var(--color-primary)] text-neutral-900 hover:brightness-110', 
  disabled = false,
  children 
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 px-4">
      <div className="glass-panel p-6 rounded-lg w-full max-w-[41.25rem] border border-white/30 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        <h2 className="text-[1.375rem] font-bold mb-6 text-white">{title}</h2>
        
        {children}

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            disabled={disabled}
            className="bg-transparent border border-gray-400 text-gray-200 font-bold py-2 px-8 rounded-[8px] hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className={`${confirmColor} font-bold py-2 px-8 rounded-[8px] transition-all disabled:opacity-50 disabled:hover:shadow-none`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}