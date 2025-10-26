import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import type { Project } from '../../store/types';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS } from '../../store/types';
import { formatRelativeTime } from '../../utils/formatters';
import { soundEffects } from '../../utils/sounds';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();

  const handleOpenProject = () => {
    soundEffects.playWhoosh();
    navigate(`/project/${project.id}`);
  };

  const handleHover = () => {
    soundEffects.playHover();
  };

  const cardStyle = project.color
    ? {
        backgroundColor: project.color,
        color: project.textColor || '#FFFFFF',
        boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)`,
      }
    : {};

  return (
    <div
      onClick={handleOpenProject}
      onMouseEnter={handleHover}
      style={cardStyle}
      className="rounded-lg shadow-2xl p-6 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all hover:scale-105 cursor-pointer border-4 border-black"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-3xl font-bold" style={{ color: project.textColor || '#FFFFFF', textShadow: '2px 2px 0px rgba(0,0,0,1)' }}>{project.displayName || project.name}</h3>
          <span className={`${STATUS_COLORS[project.status]} text-white text-base px-2 py-1 rounded mt-1 inline-block`}>
            {STATUS_LABELS[project.status]}
          </span>
        </div>
        {project.feedbackCount > 0 && (
          <span className={`${project.highestFeedbackPriority ? PRIORITY_COLORS[project.highestFeedbackPriority] : 'bg-yellow-300'} text-white text-lg font-bold px-2.5 py-0.5 rounded`}>
            {project.feedbackCount}
          </span>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-lg mb-4 line-clamp-2" style={{ color: project.textColor || '#FFFFFF' }}>
          {project.description}
        </p>
      )}

      {/* Platform & Architecture Info */}
      {(project.platform || project.isLocalFirst !== undefined || project.isOpenSource !== undefined || project.hasBackend !== undefined) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {project.platform && (
            <span className="bg-blue-100 text-blue-700 text-base px-2 py-1 rounded">
              {project.platform}
            </span>
          )}
          {project.isLocalFirst && (
            <span className="bg-green-100 text-green-700 text-base px-2 py-1 rounded">
              Local-First
            </span>
          )}
          {project.isOpenSource && (
            <span className="bg-purple-100 text-purple-700 text-base px-2 py-1 rounded">
              Open Source
            </span>
          )}
          {project.hasBackend && (
            <span className="bg-orange-100 text-orange-700 text-base px-2 py-1 rounded">
              Has Backend
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4 text-base pt-4" style={{ borderTop: `1px solid ${project.textColor}40`, color: project.textColor || '#FFFFFF' }}>
        {project.lastModified && <span>{formatRelativeTime(project.lastModified)}</span>}
        {project.deploymentUrl && (
          <span className="flex items-center gap-1" style={{ color: project.textColor || '#FFFFFF' }}>
            <ExternalLink size={16} />
            Deployed
          </span>
        )}
      </div>
    </div>
  );
}
