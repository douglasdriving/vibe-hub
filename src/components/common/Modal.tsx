import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  console.log('Modal render - isOpen:', isOpen);

  if (!isOpen) {
    console.log('Modal not rendering because isOpen is false');
    return null;
  }

  console.log('Modal rendering!');
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 999999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(2px)'
      }}
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col"
        style={{
          zIndex: 1000000,
          position: 'relative',
          backgroundColor: '#ffffff',
          opacity: 1
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="overflow-y-auto px-8 py-6 flex-1">{children}</div>
      </div>
    </div>
  );
}
