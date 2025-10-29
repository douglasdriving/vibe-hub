import { Hammer, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '../../common/Button';
import type { Issue, Project } from '../../../store/types';
import { PRIORITY_LABELS, PRIORITY_COLORS, COMPLEXITY_LABELS, COMPLEXITY_COLORS } from '../../../store/types';

interface IssuesTabProps {
  issues: Issue[];
  currentProject: Project;
  onFixAll: () => void;
  onReviewIssue: (issue: Issue) => void;
  onToggleComplete: (id: string) => void;
  onDeleteIssue: (id: string) => void;
}

export function IssuesTab({
  issues,
  currentProject,
  onFixAll,
  onReviewIssue,
  onToggleComplete,
  onDeleteIssue,
}: IssuesTabProps) {
  const pendingIssues = issues.filter(i => i.status !== 'completed');
  const reviewIssues = issues.filter(i => i.status === 'for-review');
  const activeIssues = issues.filter(i => i.status === 'pending' || i.status === 'in-progress');

  return (
    <div>
      <div className="flex items-center justify-end mb-6">
        <div className="flex gap-2">
          {activeIssues.length > 0 && (
            <Button
              variant="secondary"
              onClick={onFixAll}
              invertedBgColor={currentProject.textColor}
              invertedTextColor={currentProject.color}
            >
              <Hammer size={18} className="inline mr-2" />
              Fix All
            </Button>
          )}
        </div>
      </div>

      {pendingIssues.length === 0 ? (
        <div className="text-center py-12" style={{ color: currentProject.textColor || '#FFFFFF', opacity: 0.7 }}>
          <p>No issues yet.</p>
          <p className="mt-2">Refine raw feedback items to create issues.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* For Review Issues */}
          {reviewIssues.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-3 uppercase" style={{ color: currentProject.textColor || '#FFFFFF', textShadow: '2px 2px 0px rgba(0,0,0,1)' }}>
                Ready for Review ({reviewIssues.length})
              </h3>
              <div className="space-y-3">
                {reviewIssues
                  .sort((a, b) => a.priority - b.priority)
                  .map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => onReviewIssue(issue)}
                      className="border-4 border-black rounded-lg p-4 bg-gradient-to-br from-green-400 via-teal-500 to-cyan-500 shadow-lg cursor-pointer hover:scale-[1.02] transition-transform"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-white font-bold text-lg">{issue.title}</h3>
                            <span className="bg-white text-teal-700 px-2 py-1 rounded text-xs font-bold uppercase">Review</span>
                          </div>
                          <p className="text-white/90 mb-3">{issue.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className={`${COMPLEXITY_COLORS[issue.complexity]} text-white px-2 py-1 rounded font-semibold`}>
                              {COMPLEXITY_LABELS[issue.complexity]}
                            </span>
                            <span className={`${PRIORITY_COLORS[issue.priority]} text-white px-2 py-1 rounded`}>
                              {PRIORITY_LABELS[issue.priority]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Pending/In-Progress Issues */}
          {activeIssues.length > 0 && (
            <div>
              {reviewIssues.length > 0 && (
                <h3 className="text-xl font-bold mb-3 uppercase" style={{ color: currentProject.textColor || '#FFFFFF', textShadow: '2px 2px 0px rgba(0,0,0,1)' }}>
                  Pending Issues ({activeIssues.length})
                </h3>
              )}
              <div className="space-y-3">
                {activeIssues
                  .sort((a, b) => {
                    // Prioritize issues with reviewNotes (bug reports)
                    if (a.reviewNotes && !b.reviewNotes) return -1;
                    if (!a.reviewNotes && b.reviewNotes) return 1;
                    return a.priority - b.priority;
                  })
                  .map((issue) => (
                    <div key={issue.id} className="border-4 border-black rounded-lg p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-white font-bold text-lg">{issue.title}</h3>
                            {issue.reviewNotes && (
                              <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold uppercase">Bug Reported</span>
                            )}
                          </div>
                          <p className="text-white/90 mb-3">{issue.description}</p>
                          {issue.reviewNotes && (
                            <div className="bg-red-900/50 border-2 border-red-400 rounded p-2 mb-3">
                              <p className="text-xs font-bold text-red-200 mb-1">BUG REPORT:</p>
                              <p className="text-white/90 text-sm">{issue.reviewNotes}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <span className={`${COMPLEXITY_COLORS[issue.complexity]} text-white px-2 py-1 rounded font-semibold`}>
                              {COMPLEXITY_LABELS[issue.complexity]}
                            </span>
                            <span className={`${PRIORITY_COLORS[issue.priority]} text-white px-2 py-1 rounded`}>
                              {PRIORITY_LABELS[issue.priority]}
                            </span>
                            <button onClick={() => onToggleComplete(issue.id)} className="text-green-300 hover:text-green-100">
                              <CheckCircle size={14} className="inline mr-1" />
                              Complete
                            </button>
                            <button onClick={() => onDeleteIssue(issue.id)} className="text-red-300 hover:text-red-100">
                              <Trash2 size={14} className="inline mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
