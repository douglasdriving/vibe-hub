import { useNavigate } from 'react-router-dom';
import { ExternalLink, Folder, Terminal } from 'lucide-react';
import type { Project } from '../../store/types';
import { STATUS_LABELS, STATUS_COLORS } from '../../store/types';
import { formatRelativeTime } from '../../utils/formatters';
import { useProjectStore } from '../../store/projectStore';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  const { openInExplorer, launchClaudeCode } = useProjectStore();

  const handleOpenProject = () => {
    navigate(`/project/${project.id}`);
  };

  const handleOpenExplorer = (e: React.MouseEvent) => {
    e.stopPropagation();
    openInExplorer(project.path);
  };

  const handleLaunchClaude = (e: React.MouseEvent) => {
    e.stopPropagation();
    launchClaudeCode(project.path);
  };

  const cardStyle = project.color
    ? {
        backgroundColor: project.color,
        boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)`,
      }
    : {};

  return (
    <div
      onClick={handleOpenProject}
      style={cardStyle}
      className="rounded-lg shadow-2xl p-6 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all hover:scale-105 cursor-pointer border-4 border-black"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-3xl font-bold text-white">{project.displayName || project.name}</h3>
          <span className={`${STATUS_COLORS[project.status]} text-white text-base px-2 py-1 rounded mt-1 inline-block`}>
            {STATUS_LABELS[project.status]}
          </span>
        </div>
        {project.feedbackCount > 0 && (
          <span className="bg-yellow-300 text-black text-lg font-bold px-2.5 py-0.5 rounded">
            {project.feedbackCount}
          </span>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-white text-lg mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Platform & Architecture Info */}
      {(project.platform || project.isLocalFirst !== undefined || project.isOpenSource !== undefined || project.hasBackend !== undefined) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {project.platform && (
            <span className="bg-blue-100 text-blue-700 text-sm px-2 py-1 rounded">
              {project.platform}
            </span>
          )}
          {project.isLocalFirst && (
            <span className="bg-green-100 text-green-700 text-sm px-2 py-1 rounded">
              Local-First
            </span>
          )}
          {project.isOpenSource && (
            <span className="bg-purple-100 text-purple-700 text-sm px-2 py-1 rounded">
              Open Source
            </span>
          )}
          {project.hasBackend && (
            <span className="bg-orange-100 text-orange-700 text-sm px-2 py-1 rounded">
              Has Backend
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/30">
        <div className="flex items-center gap-4 text-base text-white">
          {project.lastModified && <span>{formatRelativeTime(project.lastModified)}</span>}
          {project.deploymentUrl && (
            <span className="flex items-center gap-1 text-yellow-300">
              <ExternalLink size={16} />
              Deployed
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleOpenExplorer}
            className="p-2 text-white hover:bg-white/20 rounded transition-colors"
            title="Open in Explorer"
          >
            <Folder size={18} />
          </button>
          <button
            onClick={handleLaunchClaude}
            className="p-2 text-white hover:bg-white/20 rounded transition-colors"
            title="Open Claude Code"
          >
            <Terminal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
