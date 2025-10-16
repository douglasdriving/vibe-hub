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
      className="fixed inset-0 overflow-y-auto flex items-center justify-center"
      style={{
        zIndex: 999999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl max-w-lg w-full mx-4"
        style={{ zIndex: 1000000 }}
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>
            {/* Content */}
            <div>{children}</div>
          </div>
        </div>
    </div>
  );
}
