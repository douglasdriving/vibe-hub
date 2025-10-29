import { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';

interface IssueReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: {
    title: string;
    description: string;
    subtasks: string[];
    status: string;
  };
  onApprove: () => Promise<void>;
  onReportBug: (bugNotes: string) => Promise<void>;
}

export function IssueReviewModal({ isOpen, onClose, issue, onApprove, onReportBug }: IssueReviewModalProps) {
  const [bugNotes, setBugNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'initial' | 'bug-report'>('initial');

  if (!isOpen) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove();
      onClose();
    } catch (error) {
      console.error('Error approving issue:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportBug = async () => {
    if (!bugNotes.trim()) return;

    setIsSubmitting(true);
    try {
      await onReportBug(bugNotes);
      setBugNotes('');
      setMode('initial');
      onClose();
    } catch (error) {
      console.error('Error reporting bug:', error);
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
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 border-4 border-black"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-4 border-black bg-gradient-to-r from-blue-400 to-purple-500">
          <h2 className="text-2xl font-bold text-white uppercase" style={{ textShadow: '2px 2px 0px rgba(0,0,0,1)' }}>
            Review Implementation
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
          {/* Issue Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Issue:
            </label>
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3 text-gray-800 font-medium">
              {issue.title}
            </div>
          </div>

          {/* Issue Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description:
            </label>
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3 text-gray-800 whitespace-pre-wrap">
              {issue.description}
            </div>
          </div>

          {/* Subtasks - Hidden when status is for-review */}
          {issue.subtasks.length > 0 && issue.status !== 'for-review' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subtasks:
              </label>
              <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3">
                <ul className="list-disc list-inside space-y-1 text-gray-800">
                  {issue.subtasks.map((subtask, index) => (
                    <li key={index}>{subtask}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Bug Report Mode */}
          {mode === 'bug-report' && (
            <div>
              <label htmlFor="bugNotes" className="block text-sm font-semibold text-gray-700 mb-2">
                Bug Report:
              </label>
              <textarea
                id="bugNotes"
                value={bugNotes}
                onChange={(e) => setBugNotes(e.target.value)}
                className="w-full border-2 border-red-300 rounded-lg p-3 focus:border-red-500 focus:outline-none min-h-[120px] resize-y text-gray-900 bg-white"
                placeholder="Describe the bugs or issues you found with this implementation..."
                autoFocus
              />
            </div>
          )}

          {/* Testing Instructions */}
          {mode === 'initial' && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Testing Instructions:</strong> Please test the implementation locally. If everything works correctly, click "Approve" to mark this issue as completed. If you found bugs or issues, click "Report Bug" to send it back for fixing.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t-4 border-black bg-gray-50 flex justify-end gap-3">
          {mode === 'initial' ? (
            <>
              <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => setMode('bug-report')}
                disabled={isSubmitting}
              >
                <AlertCircle size={18} className="mr-2" />
                Report Bug
              </Button>
              <Button
                variant="primary"
                onClick={handleApprove}
                disabled={isSubmitting}
              >
                <CheckCircle size={18} className="mr-2" />
                {isSubmitting ? 'Approving...' : 'Approve'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setMode('initial');
                  setBugNotes('');
                }}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                variant="danger"
                onClick={handleReportBug}
                disabled={!bugNotes.trim() || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Bug Report'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
