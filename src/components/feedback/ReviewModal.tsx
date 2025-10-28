import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../common/Button';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedbackText: string;
  reviewNotes: string;
  onSubmit: (answer: string) => Promise<void>;
}

export function ReviewModal({ isOpen, onClose, feedbackText, reviewNotes, onSubmit }: ReviewModalProps) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!answer.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(answer);
      setAnswer('');
      onClose();
    } catch (error) {
      console.error('Error submitting review answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 border-4 border-black"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-4 border-black bg-gradient-to-r from-orange-400 to-red-500">
          <h2 className="text-2xl font-bold text-white uppercase" style={{ textShadow: '2px 2px 0px rgba(0,0,0,1)' }}>
            Clarification Needed
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Original Feedback */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Original Feedback:
            </label>
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3 text-gray-800">
              {feedbackText}
            </div>
          </div>

          {/* Review Question */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Question:
            </label>
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3 text-gray-800">
              {reviewNotes}
            </div>
          </div>

          {/* Answer Input */}
          <div>
            <label htmlFor="answer" className="block text-sm font-semibold text-gray-700 mb-2">
              Your Answer:
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none min-h-[120px] resize-y"
              placeholder="Provide clarification to help refine this feedback..."
              autoFocus
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-4 border-black bg-gray-50 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!answer.trim() || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
