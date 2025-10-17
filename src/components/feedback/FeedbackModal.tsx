import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { FeedbackItem } from '../../store/types';
import { PRIORITY_LABELS } from '../../store/types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (feedback: Omit<FeedbackItem, 'id' | 'createdAt'>) => void;
  initialData?: FeedbackItem;
}

export function FeedbackModal({ isOpen, onClose, onSave, initialData }: FeedbackModalProps) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [error, setError] = useState('');

  console.log('FeedbackModal render - isOpen:', isOpen);

  useEffect(() => {
    console.log('FeedbackModal useEffect - isOpen:', isOpen, 'initialData:', initialData);
    if (initialData) {
      setText(initialData.text);
      setPriority(initialData.priority);
    } else {
      setText('');
      setPriority(3);
    }
    setError('');
  }, [initialData, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 5) {
          setPriority(num as 1 | 2 | 3 | 4 | 5);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      setError('Feedback text is required');
      return;
    }

    onSave({
      text: text.trim(),
      priority,
      status: initialData?.status || 'pending',
      completedAt: initialData?.completedAt,
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Feedback' : 'Add Feedback'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Feedback
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === 'Enter') {
                handleSubmit(e as any);
              }
            }}
            className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={5}
            placeholder="Describe the issue or improvement..."
          />
          {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Priority (or press 1-5)
          </label>
          <div className="flex gap-2">
            {([1, 2, 3, 4, 5] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  priority === p
                    ? 'bg-blue-500 text-white border-blue-500 font-semibold'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="text-sm font-medium">{p}</div>
                <div className="text-xs mt-1">{PRIORITY_LABELS[p]}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update' : 'Add'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
