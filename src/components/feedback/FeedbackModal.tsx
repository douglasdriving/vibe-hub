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
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
            className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {([1, 2, 3, 4, 5] as const).map((p) => (
              <option key={p} value={p}>
                {p} - {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
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
