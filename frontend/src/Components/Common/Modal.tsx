import React from 'react';
import { useUIStore } from '../../store/uiStore';
import type { ActiveModal } from '../../store/uiStore';

interface ModalProps {
  id: Exclude<ActiveModal, null>;
  title: string;
  children: React.ReactNode;
  widthClass?: string; // Tailwind width override
  heightClass?: string; // Tailwind height override
}

const Modal: React.FC<ModalProps> = ({ id, title, children, widthClass = 'w-[760px]', heightClass = 'max-h-[80vh]' }) => {
  const { activeModal, closeModal } = useUIStore();
  const isOpen = activeModal === id;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 pointer-events-none flex items-start justify-center pt-24 z-[300]">
      {/* Modal card */}
      <div className={`pointer-events-auto bg-[rgba(10,25,47,0.92)] text-white border border-cyan-400/40 shadow-2xl rounded-xl backdrop-blur-md ${widthClass} ${heightClass} overflow-hidden flex flex-col animate-[fadeIn_.25s_ease]`}>        
        <div className="flex items-center justify-between px-5 py-3 border-b border-cyan-400/30 bg-gradient-to-r from-cyan-700/30 to-transparent">
          <h3 className="m-0 font-semibold tracking-wide text-cyan-200 flex items-center gap-2">
            {title}
          </h3>
          <button onClick={closeModal} className="text-cyan-200 hover:text-white px-2 py-1 rounded transition-colors text-xl leading-none" aria-label="Cerrar">✕</button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
