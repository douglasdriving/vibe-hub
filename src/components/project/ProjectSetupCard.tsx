import { useState } from 'react';
import { Button } from '../common/Button';
import { IdeaEditorModal, IdeaFormData } from './IdeaEditorModal';
import { useProjectStore } from '../../store/projectStore';
import {
  getStageAdvancementInfo,
  getStageDescription,
  getStageIcon,
  isSetupStatus,
} from '../../utils/prompts';
import type { Project } from '../../store/types';

interface ProjectSetupCardProps {
  project: Project;
}

export function ProjectSetupCard({ project }: ProjectSetupCardProps) {
  const { saveProjectIdea } = useProjectStore();
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [draftIdeaData, setDraftIdeaData] = useState<IdeaFormData | null>(null);

  // Only show this card for projects in setup stages
  if (!isSetupStatus(project.status)) {
    return null;
  }

  const stageInfo = getStageAdvancementInfo(project.status);
  const stageIcon = getStageIcon(project.status);
  const stageDescription = getStageDescription(project.status);

  const handleSaveIdea = async (ideaData: IdeaFormData) => {
    await saveProjectIdea(project.path, ideaData);
    setDraftIdeaData(null); // Clear draft after successful save
  };

  const handleUpdateDraft = (ideaData: IdeaFormData) => {
    setDraftIdeaData(ideaData);
  };

  const handleGenerateWithClaude = () => {
    if (!stageInfo) return;

    const prompt = stageInfo.promptGenerator(project.name, project.path);

    // Copy prompt to clipboard
    navigator.clipboard.writeText(prompt).then(() => {
      // Show a success message (you could add a toast notification here)
      console.log('Prompt copied to clipboard!');
    });
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="text-4xl">{stageIcon}</div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Project Setup Pipeline
          </h2>
          <p className="text-gray-700 mb-4">{stageDescription}</p>

          {stageInfo && (
            <div className="flex gap-3">
              {project.status === 'initialized' ? (
                <Button
                  onClick={() => setIsIdeaModalOpen(true)}
                  variant="primary"
                >
                  {stageInfo.actionLabel}
                </Button>
              ) : (
                <Button
                  onClick={handleGenerateWithClaude}
                  variant="primary"
                >
                  {stageInfo.actionLabel}
                </Button>
              )}
            </div>
          )}

          {project.status !== 'initialized' && (
            <p className="text-sm text-gray-600 mt-3">
              💡 Tip: The prompt has been copied to your clipboard. Open Claude Code in this project
              directory and paste it to get started!
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-purple-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Pipeline Progress</h3>
        <div className="flex items-center gap-2">
          <StageIndicator label="Initialize" status={project.status} stage="initialized" />
          <Arrow />
          <StageIndicator label="Idea" status={project.status} stage="idea" />
          <Arrow />
          <StageIndicator label="Design" status={project.status} stage="designed" />
          <Arrow />
          <StageIndicator label="Tech Spec" status={project.status} stage="tech-spec-ready" />
          <Arrow />
          <StageIndicator label="MVP" status={project.status} stage="mvp-implemented" />
        </div>
      </div>

      <IdeaEditorModal
        isOpen={isIdeaModalOpen}
        onClose={() => setIsIdeaModalOpen(false)}
        onSave={handleSaveIdea}
        onUpdateDraft={handleUpdateDraft}
        projectName={project.name}
        draftData={draftIdeaData}
      />
    </div>
  );
}

interface StageIndicatorProps {
  label: string;
  status: string;
  stage: string;
}

function StageIndicator({ label, status, stage }: StageIndicatorProps) {
  const isCompleted = getStageOrder(status) > getStageOrder(stage);
  const isCurrent = status === stage;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          isCompleted
            ? 'bg-green-500 text-white'
            : isCurrent
            ? 'bg-blue-500 text-white'
            : 'bg-gray-300 text-gray-600'
        }`}
      >
        {isCompleted ? '✓' : getStageNumber(stage)}
      </div>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}

function Arrow() {
  return <div className="text-gray-400 pb-5">→</div>;
}

function getStageOrder(status: string): number {
  const order: Record<string, number> = {
    'initialized': 1,
    'idea': 2,
    'designed': 3,
    'tech-spec-ready': 4,
    'mvp-implemented': 5,
    'in-progress': 5,
    'deployed': 5,
  };
  return order[status] || 0;
}

function getStageNumber(stage: string): number {
  return getStageOrder(stage);
}
