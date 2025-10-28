import { CheckCircle } from 'lucide-react';
import type { Issue, FeedbackItem, Project } from '../../../store/types';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '../../../store/types';
import { formatDate } from '../../../utils/formatters';

interface CompletedTabProps {
  issues: Issue[];
  feedback: FeedbackItem[];
  archivedFeedback: FeedbackItem[];
  currentProject: Project;
  onToggleIssueComplete: (id: string) => void;
  activeTab: 'completed' | 'archived';
}

export function CompletedTab({
  issues,
  feedback,
  archivedFeedback,
  currentProject,
  onToggleIssueComplete,
  activeTab,
}: CompletedTabProps) {
  if (activeTab === 'completed') {
    const completedIssues = issues.filter(i => i.status === 'completed');
    const completedFeedback = feedback.filter(f => f.status === 'completed');

    if (completedIssues.length === 0 && completedFeedback.length === 0) {
      return (
        <div className="text-center py-12" style={{ color: currentProject.textColor || '#FFFFFF', opacity: 0.7 }}>
          <p>No completed items yet.</p>
          <p className="mt-2">Completed issues will appear here.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {completedIssues
          .sort((a, b) => {
            const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
            const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
            if (!aTime && !bTime) return 0;
            if (!aTime) return 1;
            if (!bTime) return -1;
            return bTime - aTime;
          })
          .map((issue) => (
            <div key={issue.id} className="border-4 border-black rounded-lg p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-lg opacity-60">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-2 line-through">{issue.title}</h3>
                  <p className="text-white/90 mb-3 line-through">{issue.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    {issue.completedAt && formatDate(issue.completedAt) && (
                      <span className="text-white/80">Completed: {formatDate(issue.completedAt)}</span>
                    )}
                    <span className={`${PRIORITY_COLORS[issue.priority]} text-white px-2 py-1 rounded`}>
                      {PRIORITY_LABELS[issue.priority]}
                    </span>
                    <button onClick={() => onToggleIssueComplete(issue.id)} className="text-yellow-300 hover:text-yellow-100">
                      <CheckCircle size={14} className="inline mr-1" />
                      Reopen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    );
  }

  // Archived tab
  if (archivedFeedback.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: currentProject.textColor || '#FFFFFF', opacity: 0.7 }}>
        <p>No archived feedback.</p>
        <p className="mt-2">Refined feedback items will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {archivedFeedback
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((item) => (
          <div key={item.id} className="border-4 border-black rounded-lg p-4 bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 shadow-lg opacity-70">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-white line-through">{item.text}</p>
                {item.refinedIntoIssueIds && item.refinedIntoIssueIds.length > 0 && (
                  <p className="text-white/70 text-sm mt-2">Refined into {item.refinedIntoIssueIds.length} issue(s)</p>
                )}
              </div>
              <div className="flex flex-col gap-2 items-end">
                <span className={`${PRIORITY_COLORS[item.priority]} text-white text-base px-2 py-1 rounded whitespace-nowrap opacity-60`}>
                  {PRIORITY_LABELS[item.priority]}
                </span>
              </div>
            </div>
            {formatDate(item.createdAt) && (
              <div className="flex items-center gap-4 mt-2">
                <span className="text-white/60">{formatDate(item.createdAt)}</span>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
