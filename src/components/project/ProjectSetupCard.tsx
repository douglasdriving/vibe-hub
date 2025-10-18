import { useState, useEffect } from 'react';
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
import { updateProjectStatus, createDesignFeedbackFile } from '../../services/tauri';

interface ProjectSetupCardProps {
  project: Project;
}

export function ProjectSetupCard({ project }: ProjectSetupCardProps) {
  const { saveProjectIdea, refreshProject } = useProjectStore();
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [draftIdeaData, setDraftIdeaData] = useState<IdeaFormData | null>(null);

  // Auto-create design feedback file when entering design-testing stage
  useEffect(() => {
    const createFeedbackFile = async () => {
      if (project.status === 'design-testing') {
        try {
          await createDesignFeedbackFile(project.path);
        } catch (error) {
          console.error('Failed to create design feedback file:', error);
        }
      }
    };

    createFeedbackFile();
  }, [project.status, project.path]);

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

    // Copy the idea refinement prompt to clipboard immediately
    const ideaPrompt = getStageAdvancementInfo('idea')?.promptGenerator(project.name, project.path);
    if (ideaPrompt) {
      await navigator.clipboard.writeText(ideaPrompt);
    }
  };

  const handleUpdateDraft = (ideaData: IdeaFormData) => {
    setDraftIdeaData(ideaData);
  };

  const handleGenerateWithClaude = () => {
    if (!stageInfo) return;

    const prompt = stageInfo.promptGenerator(project.name, project.path);

    // Copy prompt to clipboard
    navigator.clipboard.writeText(prompt).then(() => {
      console.log('Prompt copied to clipboard!');
    });
  };

  const handleAdvanceStage = async () => {
    if (!stageInfo) return;

    try {
      await updateProjectStatus(project.path, stageInfo.nextStatus);
      await refreshProject(project.id);
    } catch (error) {
      console.error('Failed to advance stage:', error);
    }
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
              ) : project.status === 'deployment' ? (
                // Deployment stage - just show complete button
                <Button
                  onClick={handleAdvanceStage}
                  variant="primary"
                >
                  {stageInfo.actionLabel}
                </Button>
              ) : project.status === 'design-testing' ? (
                // Design testing stage - show special instructions
                <>
                  <Button
                    onClick={handleAdvanceStage}
                    variant="primary"
                  >
                    Mark Design Review Complete
                  </Button>
                </>
              ) : (
                // All other stages - show copy prompt and advance buttons
                <>
                  <Button
                    onClick={handleGenerateWithClaude}
                    variant="primary"
                  >
                    Copy Claude Prompt
                  </Button>
                  <Button
                    onClick={handleAdvanceStage}
                    variant="secondary"
                  >
                    Mark as Complete
                  </Button>
                </>
              )}
            </div>
          )}

          {project.status !== 'initialized' && project.status !== 'deployment' && (
            <p className="text-sm text-gray-600 mt-3">
              💡 Tip: Click "Copy Claude Prompt" to get started with this stage. When you're done, click "Mark as Complete" to move to the next stage.
            </p>
          )}

          {project.status === 'deployment' && (
            <p className="text-sm text-gray-600 mt-3">
              💡 Tip: Consider the project deployed when it's live and accessible at a public URL. Update the deployment URL in the project metadata, then mark as deployed.
            </p>
          )}

          {project.status === 'design-testing' && (
            <p className="text-sm text-gray-600 mt-3">
              📝 A design feedback document has been created at <code>.vibe/design-feedback.md</code>. Fill it out with your feedback, then work with Claude to address all issues. When satisfied, mark this stage complete.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-purple-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Pipeline Progress</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <StageIndicator label="Init" status={project.status} stage="initialized" />
          <Arrow />
          <StageIndicator label="Idea" status={project.status} stage="idea" />
          <Arrow />
          <StageIndicator label="Design" status={project.status} stage="designed" />
          <Arrow />
          <StageIndicator label="Tech" status={project.status} stage="tech-spec-ready" />
          <Arrow />
          <StageIndicator label="Meta" status={project.status} stage="metadata-ready" />
          <Arrow />
          <StageIndicator label="MVP" status={project.status} stage="mvp-implemented" />
          <Arrow />
          <StageIndicator label="Test" status={project.status} stage="technical-testing" />
          <Arrow />
          <StageIndicator label="UX" status={project.status} stage="design-testing" />
          <Arrow />
          <StageIndicator label="Deploy" status={project.status} stage="deployment" />
          <Arrow />
          <StageIndicator label="Live" status={project.status} stage="deployed" />
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
    'metadata-ready': 5,
    'mvp-implemented': 6,
    'technical-testing': 7,
    'design-testing': 8,
    'deployment': 9,
    'deployed': 10,
  };
  return order[status] || 0;
}

function getStageNumber(stage: string): number {
  return getStageOrder(stage);
}
