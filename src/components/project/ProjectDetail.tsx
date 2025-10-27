import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Terminal, Folder, ExternalLink, Edit, Trash2, Wrench, Play, Hammer, Code, Github, GitBranch, Settings, CheckCircle } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { Button } from '../common/Button';
import { FeedbackModal } from '../feedback/FeedbackModal';
import { EditMetadataModal } from './EditMetadataModal';
import { ProjectSetupCard } from './ProjectSetupCard';
import { ClaudeSessionPanel } from './ClaudeSessionPanel';
import type { FeedbackItem } from '../../store/types';
import { PRIORITY_LABELS, PRIORITY_COLORS, STATUS_LABELS, STATUS_COLORS } from '../../store/types';
import { formatDate } from '../../utils/formatters';
import { isSetupStatus, generateCleanupPrompt } from '../../utils/prompts';
import { generateFeedbackRefinementPrompt, generateIssueFixPrompt } from '../../services/clipboard';
import * as tauri from '../../services/tauri';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentProject,
    feedback,
    issues,
    archivedFeedback,
    error: projectError,
    setCurrentProject,
    refreshProject,
    addFeedback,
    updateFeedback,
    deleteFeedback,
    deleteIssue,
    toggleIssueComplete,
    launchClaudeCode,
    openInExplorer,
    openDeploymentUrl,
  } = useProjectStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMetadataModalOpen, setIsEditMetadataModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<FeedbackItem | undefined>();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [availableScripts, setAvailableScripts] = useState<tauri.AvailableScripts | null>(null);
  const [githubUrl, setGithubUrl] = useState<string | null>(null);
  const [docs, setDocs] = useState<tauri.DocumentFile[]>([]);
  const [cleanupStats, setCleanupStats] = useState<tauri.CleanupStats | null>(null);
  const [projectStats, setProjectStats] = useState<tauri.ProjectStats | null>(null);
  const [activeTab, setActiveTab] = useState<'feedback' | 'issues' | 'completed' | 'archived'>('feedback');

  // Decode the project path from URL
  const projectPath = id ? decodeURIComponent(id) : null;

  useEffect(() => {
    console.log('[ProjectDetail] useEffect triggered');
    console.log('[ProjectDetail] URL id param:', id);
    console.log('[ProjectDetail] Decoded projectPath:', projectPath);
    console.log('[ProjectDetail] currentProject:', currentProject);
    console.log('[ProjectDetail] hasLoaded:', hasLoaded);

    // Only load project if we haven't loaded it yet, or if the path changed
    if (projectPath && (!currentProject || currentProject.path !== projectPath || !hasLoaded)) {
      console.log('[ProjectDetail] Conditions met, calling setCurrentProject with:', projectPath);
      try {
        setCurrentProject(projectPath);
        setHasLoaded(true);
        console.log('[ProjectDetail] setCurrentProject called successfully');
      } catch (error) {
        console.error('[ProjectDetail] Error calling setCurrentProject:', error);
      }
    } else {
      console.log('[ProjectDetail] Conditions NOT met, skipping load');
      console.log('[ProjectDetail] - projectPath exists?', !!projectPath);
      console.log('[ProjectDetail] - currentProject path matches?', currentProject?.path === projectPath);
      console.log('[ProjectDetail] - hasLoaded?', hasLoaded);
    }
  }, [projectPath]);

  useEffect(() => {
    // Detect available npm scripts when project loads
    if (currentProject) {
      tauri.detectNpmScripts(currentProject.path).then(scripts => {
        setAvailableScripts(scripts);
      }).catch(() => {
        // Silently handle error
      });

      // Get GitHub URL
      tauri.getGithubUrl(currentProject.path).then(url => {
        setGithubUrl(url);
      }).catch(() => {
        // Silently handle error
      });

      // Get project documentation files
      tauri.getProjectDocs(currentProject.path).then(docs => {
        setDocs(docs);
      }).catch(() => {
        // Silently handle error
      });

      // Get cleanup stats
      tauri.getCleanupStats(currentProject.path).then(stats => {
        setCleanupStats(stats);
      }).catch(() => {
        // Silently handle error
      });

      // Get project statistics
      tauri.getProjectStats(currentProject.path).then(stats => {
        setProjectStats(stats);
      }).catch(() => {
        // Silently handle error
      });
    }
  }, [currentProject]);

  const handleAddFeedback = () => {
    setEditingFeedback(undefined);
    setIsModalOpen(true);
  };

  const handleEditFeedback = (item: FeedbackItem) => {
    setEditingFeedback(item);
    setIsModalOpen(true);
  };

  const handleSaveFeedback = async (feedbackData: Omit<FeedbackItem, 'id' | 'createdAt'>) => {
    if (!currentProject) return;

    try {
      if (editingFeedback) {
        await updateFeedback(currentProject.path, editingFeedback.id, {
          ...editingFeedback,
          ...feedbackData,
        });
      } else {
        await addFeedback(currentProject.path, feedbackData);
      }
    } catch {
      // Silently handle error
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!currentProject) return;
    if (!confirm('Are you sure you want to delete this feedback item?')) return;

    try {
      await deleteFeedback(currentProject.path, feedbackId);
    } catch {
      // Silently handle error
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    if (!currentProject) return;
    if (!confirm('Are you sure you want to delete this issue?')) return;

    try {
      await deleteIssue(currentProject.path, issueId);
    } catch {
      // Silently handle error
    }
  };

  const handleToggleIssueComplete = async (issueId: string) => {
    if (!currentProject) return;

    try {
      await toggleIssueComplete(currentProject.path, issueId);
    } catch {
      // Silently handle error
    }
  };

  const handleLaunchClaude = async (feedbackIds?: string[]) => {
    if (!currentProject) return;
    await launchClaudeCode(currentProject.path, feedbackIds);
  };

  const handleRefineAllFeedback = async () => {
    if (!currentProject) return;
    try {
      const prompt = await generateFeedbackRefinementPrompt(
        currentProject.name,
        currentProject.path
      );
      await tauri.launchClaudeCode(currentProject.path, prompt);
    } catch (error) {
      console.error('Failed to launch feedback refinement:', error);
    }
  };

  const handleFixAllIssues = async () => {
    if (!currentProject) return;
    try {
      const prompt = await generateIssueFixPrompt(
        currentProject.name,
        currentProject.path
      );
      await tauri.launchClaudeCode(currentProject.path, prompt);
    } catch (error) {
      console.error('Failed to launch issue fix:', error);
    }
  };

  const handleLaunchWithoutContext = async () => {
    handleLaunchClaude(undefined);
  };

  const handleRunDev = async () => {
    if (!currentProject || !availableScripts?.dev_script_name) return;
    try {
      await tauri.runNpmScript(
        currentProject.path,
        availableScripts.dev_script_name,
        availableScripts.dev_script_type || undefined
      );
    } catch {
      // Silently handle error
    }
  };

  const handleRunBuild = async () => {
    if (!currentProject) return;
    try {
      await tauri.runNpmScript(currentProject.path, 'build');
    } catch {
      // Silently handle error
    }
  };

  const handleOpenExplorer = () => {
    if (!currentProject) return;
    openInExplorer(currentProject.path);
  };

  const handleOpenDeployment = () => {
    if (!currentProject?.deploymentUrl) return;
    openDeploymentUrl(currentProject.deploymentUrl);
  };

  const handleOpenVscode = async () => {
    if (!currentProject) return;
    try {
      await tauri.openInVscode(currentProject.path);
    } catch {
      // Silently handle error
    }
  };

  const handleOpenTerminal = async () => {
    if (!currentProject) return;
    try {
      await tauri.openInTerminal(currentProject.path);
    } catch {
      // Silently handle error
    }
  };

  const handleOpenGithub = async () => {
    if (!githubUrl) return;
    try {
      await tauri.openUrl(githubUrl);
    } catch {
      // Silently handle error
    }
  };

  const handleOpenFork = async () => {
    if (!currentProject) return;
    try {
      await tauri.openInFork(currentProject.path);
    } catch {
      // Silently handle error
    }
  };

  const handleSaveMetadata = async (data: {
    displayName: string;
    description: string;
    platform: string;
    status: string;
    deploymentUrl: string;
  }) => {
    if (!currentProject) return;

    try {
      await tauri.updateAllMetadata(
        currentProject.path,
        data.displayName || null,
        data.description,
        data.platform || null,
        data.status,
        data.deploymentUrl || null
      );

      // Refresh the project to reflect changes immediately
      await refreshProject(currentProject.id);
    } catch (error) {
      throw error;
    }
  };

  const handleOpenDoc = async (docPath: string) => {
    try {
      await tauri.openInVscode(docPath);
    } catch {
      // Silently handle error
    }
  };

  const handleCleanupRefactor = async () => {
    if (!currentProject) return;

    try {
      // Generate cleanup prompt
      const prompt = generateCleanupPrompt(currentProject.displayName || currentProject.name);

      // Launch Claude Code directly - the counter will reset when the cleanup commit is made
      await tauri.launchClaudeCode(currentProject.path, prompt);
    } catch {
      // Silently handle error
    }
  };


  if (projectError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-red-50 border-4 border-red-500 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-red-900 mb-2">Failed to Load Project</h2>
              <p className="text-red-800 mb-4">{projectError}</p>

              {projectError.includes('issues file') && (
                <div className="bg-white border-2 border-red-300 rounded p-4 mb-4">
                  <h3 className="font-bold text-red-900 mb-2">Issue File Format Error</h3>
                  <p className="text-sm text-red-800 mb-2">
                    The <code className="bg-red-100 px-1 rounded">.vibe/issues.json</code> file has an incorrect format.
                    It may be missing required fields like <code className="bg-red-100 px-1 rounded">timeEstimate</code>.
                  </p>
                  <p className="text-sm text-red-800">
                    Please check the file or delete it to reset. See the console for more details.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Reload App
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading project...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: currentProject.color, color: currentProject.textColor || '#FFFFFF' }}>
      {/* Header */}
      <header className="shadow-sm" style={{ backgroundColor: currentProject.color }}>
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-6xl uppercase font-bold" style={{ color: currentProject.textColor || '#FFFFFF', textShadow: '3px 3px 0px rgba(0,0,0,1)' }}>{currentProject.displayName || currentProject.name}</h1>
                <span className={`${STATUS_COLORS[currentProject.status]} text-white text-base px-3 py-1 rounded`}>
                  {STATUS_LABELS[currentProject.status]}
                </span>
              </div>
              {currentProject.lastModified && (
                <p className="mt-1" style={{ color: currentProject.textColor || '#FFFFFF', opacity: 0.8 }}>
                  Last modified: {formatDate(currentProject.lastModified)}
                </p>
              )}
            </div>

            {/* Project Statistics */}
            {projectStats && (
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: currentProject.textColor || '#FFFFFF' }}>
                    {projectStats.totalCommits.toLocaleString()}
                  </div>
                  <div className="text-sm opacity-70" style={{ color: currentProject.textColor || '#FFFFFF' }}>
                    Commits
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: currentProject.textColor || '#FFFFFF' }}>
                    {projectStats.linesOfCode.toLocaleString()}
                  </div>
                  <div className="text-sm opacity-70" style={{ color: currentProject.textColor || '#FFFFFF' }}>
                    Lines of Code
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: currentProject.textColor || '#FFFFFF' }}>
                    {projectStats.feedbackCompleted.toLocaleString()}
                  </div>
                  <div className="text-sm opacity-70" style={{ color: currentProject.textColor || '#FFFFFF' }}>
                    Fixes
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        {/* Project Setup Card - only shown for setup stages */}
        <ProjectSetupCard project={currentProject} />

        {/* Action Buttons */}
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            {currentProject.deploymentUrl && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenDeployment}
                invertedBgColor={currentProject.textColor}
                invertedTextColor={currentProject.color}
              >
                <ExternalLink size={16} className="inline mr-2" />
                Open App
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleLaunchWithoutContext}
              invertedBgColor={currentProject.textColor}
              invertedTextColor={currentProject.color}
            >
              <Terminal size={16} className="inline mr-2" />
              Claude
            </Button>
            {currentProject.hasGitRepo && cleanupStats?.shouldCleanup && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCleanupRefactor}
                invertedBgColor={currentProject.textColor}
                invertedTextColor={currentProject.color}
                className="relative"
                title={`${cleanupStats.commitsSinceCleanup} commits since last cleanup (threshold: ${cleanupStats.cleanupThreshold})`}
              >
                <Wrench size={16} className="inline mr-2" />
                Cleanup
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {cleanupStats.commitsSinceCleanup}
                </span>
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenExplorer}
              invertedBgColor={currentProject.textColor}
              invertedTextColor={currentProject.color}
            >
              <Folder size={16} className="inline mr-2" />
              Open Folder
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenVscode}
              invertedBgColor={currentProject.textColor}
              invertedTextColor={currentProject.color}
            >
              <Code size={16} className="inline mr-2" />
              VS Code
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenTerminal}
              invertedBgColor={currentProject.textColor}
              invertedTextColor={currentProject.color}
            >
              <Terminal size={16} className="inline mr-2" />
              Terminal
            </Button>
            {githubUrl && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenGithub}
                invertedBgColor={currentProject.textColor}
                invertedTextColor={currentProject.color}
              >
                <Github size={16} className="inline mr-2" />
                GitHub
              </Button>
            )}
            {currentProject.hasGitRepo && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenFork}
                invertedBgColor={currentProject.textColor}
                invertedTextColor={currentProject.color}
              >
                <GitBranch size={16} className="inline mr-2" />
                Fork
              </Button>
            )}
            {availableScripts?.has_dev && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRunDev}
                invertedBgColor={currentProject.textColor}
                invertedTextColor={currentProject.color}
              >
                <Play size={16} className="inline mr-2" />
                Run Dev
              </Button>
            )}
            {availableScripts?.has_build && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRunBuild}
                invertedBgColor={currentProject.textColor}
                invertedTextColor={currentProject.color}
              >
                <Hammer size={16} className="inline mr-2" />
                Build
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditMetadataModalOpen(true)}
              invertedBgColor={currentProject.textColor}
              invertedTextColor={currentProject.color}
            >
              <Settings size={16} className="inline mr-2" />
              Edit Info
            </Button>
          </div>
        </div>

        {/* Claude Session Panel */}
        {!isSetupStatus(currentProject.status) && (
          <ClaudeSessionPanel
            projectPath={currentProject.path}
            textColor={currentProject.textColor}
            bgColor={currentProject.color}
          />
        )}

        {/* Project Info */}
        <div className="mb-6">
          {currentProject.description ? (
            <p className="text-base" style={{ color: currentProject.textColor || '#FFFFFF' }}>{currentProject.description}</p>
          ) : (
            <p className="text-base italic" style={{ color: currentProject.textColor || '#FFFFFF', opacity: 0.7 }}>No description yet. Complete the project setup to add one.</p>
          )}

          {/* Platform & Architecture */}
          {(currentProject.platform || currentProject.isLocalFirst || currentProject.isOpenSource || currentProject.hasBackend) ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {currentProject.platform && (
                <span className="bg-blue-100 text-blue-700 text-base px-3 py-1 rounded">{currentProject.platform}</span>
              )}
              {currentProject.isLocalFirst && (
                <span className="bg-green-100 text-green-700 text-base px-3 py-1 rounded">Local-First</span>
              )}
              {currentProject.isOpenSource && (
                <span className="bg-purple-100 text-purple-700 text-base px-3 py-1 rounded">Open Source</span>
              )}
              {currentProject.hasBackend && (
                <span className="bg-orange-100 text-orange-700 text-base px-3 py-1 rounded">Has Backend</span>
              )}
            </div>
          ) : (
            <p className="mb-4 italic" style={{ color: currentProject.textColor || '#FFFFFF', opacity: 0.7 }}>No platform info specified yet.</p>
          )}
        </div>

        {/* Documentation Section */}
        {docs.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4 uppercase" style={{ color: currentProject.textColor || '#FFFFFF', textShadow: '2px 2px 0px rgba(0,0,0,1)' }}>Documentation</h2>
            <div className="flex flex-wrap gap-2">
              {docs.map((doc) => {
                // Format document name: remove .md, replace _ and - with spaces, title case
                const formatDocName = (name: string) => {
                  return name
                    .replace(/\.md$/i, '') // Remove .md extension
                    .replace(/[_-]/g, ' ') // Replace _ and - with spaces
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                };

                // Format the timestamp to a readable date
                const formatDate = (timestamp: number) => {
                  const date = new Date(timestamp * 1000);
                  const now = new Date();
                  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

                  if (diffDays === 0) return 'Today';
                  if (diffDays === 1) return 'Yesterday';
                  if (diffDays < 7) return `${diffDays}d ago`;
                  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
                  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
                  return `${Math.floor(diffDays / 365)}y ago`;
                };

                return (
                  <button
                    key={doc.path}
                    onClick={() => handleOpenDoc(doc.path)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded border-2 border-white/20 hover:border-white/40 transition-colors text-sm"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: currentProject.textColor || '#FFFFFF' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium">{formatDocName(doc.name)}</span>
                    <span className="text-xs opacity-60">· {formatDate(doc.modifiedTimestamp)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Feedback & Issues Section - only show for projects past setup stages */}
        {!isSetupStatus(currentProject.status) && (
        <div>
          {/* Tab Navigation */}
          <div className="flex gap-4 mb-6 border-b-4 border-black">
            <button
              onClick={() => setActiveTab('feedback')}
              className={`text-xl font-bold px-4 py-2 uppercase transition-colors ${
                activeTab === 'feedback'
                  ? 'border-b-4 border-white'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                color: currentProject.textColor || '#FFFFFF',
                textShadow: '2px 2px 0px rgba(0,0,0,1)',
                marginBottom: '-4px'
              }}
            >
              Feedback ({feedback.filter(f => f.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`text-xl font-bold px-4 py-2 uppercase transition-colors ${
                activeTab === 'issues'
                  ? 'border-b-4 border-white'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                color: currentProject.textColor || '#FFFFFF',
                textShadow: '2px 2px 0px rgba(0,0,0,1)',
                marginBottom: '-4px'
              }}
            >
              Issues ({issues.filter(i => i.status !== 'completed').length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`text-xl font-bold px-4 py-2 uppercase transition-colors ${
                activeTab === 'completed'
                  ? 'border-b-4 border-white'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                color: currentProject.textColor || '#FFFFFF',
                textShadow: '2px 2px 0px rgba(0,0,0,1)',
                marginBottom: '-4px'
              }}
            >
              Completed ({feedback.filter(f => f.status === 'completed').length + issues.filter(i => i.status === 'completed').length})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`text-xl font-bold px-4 py-2 uppercase transition-colors ${
                activeTab === 'archived'
                  ? 'border-b-4 border-white'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                color: currentProject.textColor || '#FFFFFF',
                textShadow: '2px 2px 0px rgba(0,0,0,1)',
                marginBottom: '-4px'
              }}
            >
              Archived ({archivedFeedback.length})
            </button>
          </div>

          {/* Feedback Tab */}
          {activeTab === 'feedback' && (
            <div>
              <div className="flex items-center justify-end mb-6">
                <div className="flex gap-2">
                  {feedback.filter(f => f.status === 'pending').length > 0 && (
                    <Button
                      variant="secondary"
                      onClick={handleRefineAllFeedback}
                      invertedBgColor={currentProject.textColor}
                      invertedTextColor={currentProject.color}
                    >
                      <Wrench size={18} className="inline mr-2" />
                      Refine All
                    </Button>
                  )}
                  <Button
                    onClick={handleAddFeedback}
                    invertedBgColor={currentProject.textColor}
                    invertedTextColor={currentProject.color}
                  >
                    <Plus size={18} className="inline mr-2" />
                    Add Feedback
                  </Button>
                </div>
              </div>

              {feedback.filter(f => f.status === 'pending').length === 0 ? (
                <div className="text-center py-12" style={{ color: currentProject.textColor || '#FFFFFF', opacity: 0.7 }}>
                  <p>No raw feedback items.</p>
                  <p className="mt-2">Click "Add Feedback" to create one.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedback
                    .filter(f => f.status === 'pending')
                    .sort((a, b) => a.priority - b.priority)
                    .map((item) => (
                      <div key={item.id} className="border-4 border-black rounded-lg p-4 bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 shadow-lg">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-white flex-1">{item.text}</p>
                          <span className={`${PRIORITY_COLORS[item.priority]} text-white text-base px-2 py-1 rounded whitespace-nowrap`}>
                            {PRIORITY_LABELS[item.priority]}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          {formatDate(item.createdAt) && (
                            <span className="text-white/80">{formatDate(item.createdAt)}</span>
                          )}
                          <div className="flex gap-2">
                            <button onClick={() => handleEditFeedback(item)} className="text-yellow-300 hover:text-yellow-100">
                              <Edit size={14} className="inline mr-1" />
                              Edit
                            </button>
                            <button onClick={() => handleDeleteFeedback(item.id)} className="text-red-300 hover:text-red-100">
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
          )}

          {/* Issues Tab */}
          {activeTab === 'issues' && (
            <div>
              <div className="flex items-center justify-end mb-6">
                <div className="flex gap-2">
                  {issues.filter(i => i.status !== 'completed').length > 0 && (
                    <Button
                      variant="secondary"
                      onClick={handleFixAllIssues}
                      invertedBgColor={currentProject.textColor}
                      invertedTextColor={currentProject.color}
                    >
                      <Hammer size={18} className="inline mr-2" />
                      Fix All
                    </Button>
                  )}
                </div>
              </div>

              {issues.filter(i => i.status !== 'completed').length === 0 ? (
                <div className="text-center py-12" style={{ color: currentProject.textColor || '#FFFFFF', opacity: 0.7 }}>
                  <p>No issues yet.</p>
                  <p className="mt-2">Refine raw feedback items to create issues.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {issues
                    .filter(i => i.status !== 'completed')
                    .sort((a, b) => a.priority - b.priority)
                    .map((issue) => (
                      <div key={issue.id} className="border-4 border-black rounded-lg p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-white font-bold text-lg mb-2">{issue.title}</h3>
                            <p className="text-white/90 mb-3">{issue.description}</p>
                            {issue.subtasks.length > 0 && (
                              <div className="mb-3">
                                <p className="text-white/80 text-sm font-bold mb-1">Subtasks:</p>
                                <ul className="list-disc list-inside text-white/80 text-sm space-y-1">
                                  {issue.subtasks.map((subtask, idx) => (
                                    <li key={idx}>{subtask}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-white/80">Est: {issue.timeEstimate}</span>
                              <span className={`${PRIORITY_COLORS[issue.priority]} text-white px-2 py-1 rounded`}>
                                {PRIORITY_LABELS[issue.priority]}
                              </span>
                              <button onClick={() => handleToggleIssueComplete(issue.id)} className="text-green-300 hover:text-green-100">
                                <CheckCircle size={14} className="inline mr-1" />
                                Complete
                              </button>
                              <button onClick={() => handleDeleteIssue(issue.id)} className="text-red-300 hover:text-red-100">
                                <Trash2 size={14} className="inline mr-1" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Completed Tab */}
          {activeTab === 'completed' && (
            <div>
              {feedback.filter(f => f.status === 'completed').length === 0 && issues.filter(i => i.status === 'completed').length === 0 ? (
                <div className="text-center py-12" style={{ color: currentProject.textColor || '#FFFFFF', opacity: 0.7 }}>
                  <p>No completed items yet.</p>
                  <p className="mt-2">Completed feedback and issues will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Completed Feedback */}
                  {feedback
                    .filter(f => f.status === 'completed')
                    .sort((a, b) => {
                      if (!a.completedAt && !b.completedAt) return 0;
                      if (!a.completedAt) return 1;
                      if (!b.completedAt) return -1;
                      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
                    })
                    .map((item) => (
                      <div key={item.id} className="border-4 border-black rounded-lg p-4 bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 shadow-lg opacity-60">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-white flex-1 line-through">{item.text}</p>
                          <span className={`${PRIORITY_COLORS[item.priority]} text-white text-base px-2 py-1 rounded whitespace-nowrap`}>
                            {PRIORITY_LABELS[item.priority]}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          {item.completedAt && formatDate(item.completedAt) && (
                            <span className="text-white/80">Completed: {formatDate(item.completedAt)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  {/* Completed Issues */}
                  {issues
                    .filter(i => i.status === 'completed')
                    .sort((a, b) => {
                      if (!a.completedAt && !b.completedAt) return 0;
                      if (!a.completedAt) return 1;
                      if (!b.completedAt) return -1;
                      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
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
                              <button onClick={() => handleToggleIssueComplete(issue.id)} className="text-yellow-300 hover:text-yellow-100">
                                <CheckCircle size={14} className="inline mr-1" />
                                Reopen
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Archived Tab */}
          {activeTab === 'archived' && (
            <div>
              {archivedFeedback.length === 0 ? (
                <div className="text-center py-12" style={{ color: currentProject.textColor || '#FFFFFF', opacity: 0.7 }}>
                  <p>No archived feedback.</p>
                  <p className="mt-2">Refined feedback items will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {archivedFeedback
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((item) => (
                      <div key={item.id} className="border-4 border-black rounded-lg p-4 bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 shadow-lg opacity-70">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-white flex-1">{item.text}</p>
                          <span className={`${PRIORITY_COLORS[item.priority]} text-white text-base px-2 py-1 rounded whitespace-nowrap`}>
                            {PRIORITY_LABELS[item.priority]}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          {formatDate(item.createdAt) && (
                            <span className="text-white/80">Created: {formatDate(item.createdAt)}</span>
                          )}
                          {item.refinedIntoIssueIds && item.refinedIntoIssueIds.length > 0 && (
                            <span className="text-white/80">→ {item.refinedIntoIssueIds.length} issue(s)</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
        )}
      </main>

      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveFeedback}
        initialData={editingFeedback}
      />

      <EditMetadataModal
        isOpen={isEditMetadataModalOpen}
        onClose={() => setIsEditMetadataModalOpen(false)}
        onSave={handleSaveMetadata}
        project={currentProject}
      />
    </div>
  );
}
