import { Plus, Edit, Trash2, Wrench, Github } from 'lucide-react';
import { Button } from '../../common/Button';
import type { FeedbackItem, Project } from '../../../store/types';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '../../../store/types';
import { formatDate } from '../../../utils/formatters';

interface FeedbackTabProps {
  feedback: FeedbackItem[];
  currentProject: Project;
  onAddFeedback: () => void;
  onEditFeedback: (item: FeedbackItem) => void;
  onDeleteFeedback: (id: string) => void;
  onReviewFeedback: (item: FeedbackItem) => void;
  onRefineAll: () => void;
}

export function FeedbackTab({
  feedback,
  currentProject,
  onAddFeedback,
  onEditFeedback,
  onDeleteFeedback,
  onReviewFeedback,
  onRefineAll,
}: FeedbackTabProps) {
  const pendingFeedback = feedback.filter(f => f.status === 'pending' || f.status === 'needs-review');

  return (
    <div>
      <div className="flex items-center justify-end mb-6">
        <div className="flex gap-2">
          {feedback.filter(f => f.status === 'pending').length > 0 && (
            <Button
              variant="secondary"
              onClick={onRefineAll}
              invertedBgColor={currentProject.textColor}
              invertedTextColor={currentProject.color}
            >
              <Wrench size={18} className="inline mr-2" />
              Refine All
            </Button>
          )}
          <Button
            onClick={onAddFeedback}
            invertedBgColor={currentProject.textColor}
            invertedTextColor={currentProject.color}
          >
            <Plus size={18} className="inline mr-2" />
            Add Feedback
          </Button>
        </div>
      </div>

      {pendingFeedback.length === 0 ? (
        <div className="text-center py-12" style={{ color: currentProject.textColor || '#FFFFFF', opacity: 0.7 }}>
          <p>No raw feedback items.</p>
          <p className="mt-2">Click "Add Feedback" to create one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingFeedback
            .sort((a, b) => {
              // Sort needs-review first, then by priority
              if (a.status === 'needs-review' && b.status !== 'needs-review') return -1;
              if (a.status !== 'needs-review' && b.status === 'needs-review') return 1;
              return a.priority - b.priority;
            })
            .map((item) => (
              <div
                key={item.id}
                className={`border-4 border-black rounded-lg p-4 shadow-lg ${
                  item.status === 'needs-review'
                    ? 'bg-gradient-to-br from-orange-500 via-yellow-500 to-amber-500 cursor-pointer hover:scale-[1.02] transition-transform'
                    : 'bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600'
                }`}
                onClick={() => item.status === 'needs-review' ? onReviewFeedback(item) : undefined}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {(() => {
                      // Check if feedback has user clarification (new format)
                      const newClarificationMarker = '\n\nClarification Q: ';
                      const oldClarificationMarker = '\n\nUser clarification: ';

                      if (item.text.includes(newClarificationMarker)) {
                        // New format with both question and answer
                        const [originalText, clarificationSection] = item.text.split(newClarificationMarker);
                        const [question, answer] = clarificationSection.split('\nClarification A: ');

                        return (
                          <>
                            <p className="text-white">{originalText}</p>
                            <div className="mt-3 p-3 bg-white/20 rounded-lg border-2 border-white/40">
                              <p className="text-white/90 text-xs font-bold mb-2">CLARIFICATION:</p>
                              <div className="mb-2">
                                <p className="text-white/80 text-sm font-semibold">Q:</p>
                                <p className="text-white text-sm ml-2">{question}</p>
                              </div>
                              <div>
                                <p className="text-white/80 text-sm font-semibold">A:</p>
                                <p className="text-white text-sm ml-2">{answer}</p>
                              </div>
                            </div>
                          </>
                        );
                      } else if (item.text.includes(oldClarificationMarker)) {
                        // Old format (backward compatibility)
                        const [originalText, clarification] = item.text.split(oldClarificationMarker);
                        return (
                          <>
                            <p className="text-white">{originalText}</p>
                            <div className="mt-3 p-3 bg-white/20 rounded-lg border-2 border-white/40">
                              <p className="text-white/90 text-xs font-bold mb-1">USER CLARIFICATION:</p>
                              <p className="text-white">{clarification}</p>
                            </div>
                          </>
                        );
                      }

                      return <p className="text-white">{item.text}</p>;
                    })()}
                    {item.status === 'needs-review' && item.reviewNotes && (
                      <div className="mt-2 p-2 bg-white/20 rounded border border-white/30">
                        <p className="text-white/90 text-sm font-semibold">Click to answer clarification question</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {item.status === 'needs-review' && (
                      <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded uppercase">
                        Needs Review
                      </span>
                    )}
                    {item.githubIssueNumber && (
                      <a
                        href={item.githubIssueUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1 hover:bg-gray-700 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Github size={12} />
                        #{item.githubIssueNumber}
                      </a>
                    )}
                    <span className={`${PRIORITY_COLORS[item.priority]} text-white text-base px-2 py-1 rounded whitespace-nowrap`}>
                      {PRIORITY_LABELS[item.priority]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  {formatDate(item.createdAt) && (
                    <span className="text-white/80">{formatDate(item.createdAt)}</span>
                  )}
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => onEditFeedback(item)} className="text-yellow-300 hover:text-yellow-100">
                      <Edit size={14} className="inline mr-1" />
                      Edit
                    </button>
                    <button onClick={() => onDeleteFeedback(item.id)} className="text-red-300 hover:text-red-100">
                      <Trash2 size={14} className="inline mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
