import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Terminal, Folder, ExternalLink, Edit, Trash2, Wrench, Copy, Play, Hammer, Code, Github, GitBranch, Settings } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { Button } from '../common/Button';
import { FeedbackModal } from '../feedback/FeedbackModal';
import { EditMetadataModal } from './EditMetadataModal';
import { ProjectSetupCard } from './ProjectSetupCard';
import type { FeedbackItem } from '../../store/types';
import { PRIORITY_LABELS, PRIORITY_COLORS, STATUS_LABELS, STATUS_COLORS } from '../../store/types';
import { formatDate } from '../../utils/formatters';
import { copyToClipboard, generateClaudePrompt } from '../../services/clipboard';
import { isSetupStatus, generateCleanupPrompt } from '../../utils/prompts';
import * as tauri from '../../services/tauri';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentProject,
    feedback,
    setCurrentProject,
    refreshProject,
    addFeedback,
    updateFeedback,
    deleteFeedback,
    toggleFeedbackComplete,
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
  const [commitsSinceCleanup, setCommitsSinceCleanup] = useState<number>(0);

  useEffect(() => {
    // Only load project if we haven't loaded it yet, or if the ID changed
    if (id && (!currentProject || currentProject.id !== id || !hasLoaded)) {
      setCurrentProject(id);
      setHasLoaded(true);
    }
  }, [id]);

  useEffect(() => {
    // Detect available npm scripts when project loads
    if (currentProject) {
      tauri.detectNpmScripts(currentProject.path).then(scripts => {
        setAvailableScripts(scripts);
      }).catch(err => {
        console.error('Failed to detect npm scripts:', err);
      });

      // Get GitHub URL
      tauri.getGithubUrl(currentProject.path).then(url => {
        setGithubUrl(url);
      }).catch(err => {
        console.error('Failed to get GitHub URL:', err);
      });

      // Get project documentation files
      tauri.getProjectDocs(currentProject.path).then(docs => {
        setDocs(docs);
      }).catch(err => {
        console.error('Failed to get project docs:', err);
      });

      // Count commits since last cleanup
      tauri.countCommitsSinceCleanup(currentProject.path).then(count => {
        setCommitsSinceCleanup(count);
      }).catch(err => {
        console.error('Failed to count commits:', err);
      });
    }
  }, [currentProject]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  const handleBack = () => {
    navigate('/');
  };

  const handleAddFeedback = () => {
    console.log('Add Feedback button clicked');
    console.log('Current isModalOpen:', isModalOpen);
    setEditingFeedback(undefined);
    setIsModalOpen(true);
    console.log('Set isModalOpen to true');
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
    } catch (error) {
      console.error('Failed to save feedback:', error);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!currentProject) return;
    if (!confirm('Are you sure you want to delete this feedback item?')) return;

    try {
      await deleteFeedback(currentProject.path, feedbackId);
    } catch (error) {
      console.error('Failed to delete feedback:', error);
    }
  };

  const handleToggleComplete = async (feedbackId: string) => {
    if (!currentProject) return;

    try {
      await toggleFeedbackComplete(currentProject.path, feedbackId);
    } catch (error) {
      console.error('Failed to toggle feedback:', error);
    }
  };

  const handleLaunchClaude = (feedbackIds?: string[]) => {
    if (!currentProject) return;
    launchClaudeCode(currentProject.path, feedbackIds);
  };

  const handleLaunchWithAllPending = () => {
    const pendingIds = feedback.filter(f => f.status === 'pending').map(f => f.id);
    handleLaunchClaude(pendingIds);
  };

  const handleCopyFixPrompt = async () => {
    if (!currentProject) return;

    const prompt = await generateClaudePrompt(currentProject.name, currentProject.path);
    await copyToClipboard(prompt);
  };

  const handleLaunchWithoutContext = () => {
    handleLaunchClaude([]);
  };

  const handleRunDev = async () => {
    if (!currentProject || !availableScripts?.dev_script_name) return;
    try {
      await tauri.runNpmScript(
        currentProject.path,
        availableScripts.dev_script_name,
        availableScripts.dev_script_type || undefined
      );
    } catch (error) {
      console.error('Failed to run dev server:', error);
    }
  };

  const handleRunBuild = async () => {
    if (!currentProject) return;
    try {
      await tauri.runNpmScript(currentProject.path, 'build');
    } catch (error) {
      console.error('Failed to run build:', error);
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
    } catch (error) {
      console.error('Failed to open VS Code:', error);
    }
  };

  const handleOpenTerminal = async () => {
    if (!currentProject) return;
    try {
      await tauri.openInTerminal(currentProject.path);
    } catch (error) {
      console.error('Failed to open terminal:', error);
    }
  };

  const handleOpenGithub = async () => {
    if (!githubUrl) return;
    try {
      await tauri.openUrl(githubUrl);
    } catch (error) {
      console.error('Failed to open GitHub:', error);
    }
  };

  const handleOpenFork = async () => {
    if (!currentProject) return;
    try {
      await tauri.openInFork(currentProject.path);
    } catch (error) {
      console.error('Failed to open Fork:', error);
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
      console.error('Failed to update metadata:', error);
      throw error;
    }
  };

  const handleOpenDoc = async (docPath: string) => {
    try {
      await tauri.openInVscode(docPath);
    } catch (error) {
      console.error('Failed to open document:', error);
    }
  };

  const handleCleanupRefactor = async () => {
    if (!currentProject) return;

    try {
      // Generate and copy cleanup prompt
      const prompt = generateCleanupPrompt(currentProject.displayName || currentProject.name);
      await copyToClipboard(prompt);

      // Launch Claude Code directly - the counter will reset when the cleanup commit is made
      await tauri.launchClaudeCode(currentProject.path, prompt);
    } catch (error) {
      console.error('Failed to launch cleanup:', error);
    }
  };


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
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="hover:opacity-75"
                style={{ color: currentProject.textColor || '#FFFFFF' }}
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-6xl uppercase" style={{ color: currentProject.textColor || '#FFFFFF' }}>{currentProject.displayName || currentProject.name}</h1>
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
            </div>

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
              {commitsSinceCleanup >= 30 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCleanupRefactor}
                  invertedBgColor={currentProject.textColor}
                  invertedTextColor={currentProject.color}
                  className="relative"
                >
                  <Wrench size={16} className="inline mr-2" />
                  Cleanup
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {commitsSinceCleanup}
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
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        {/* Project Setup Card - only shown for setup stages */}
        <ProjectSetupCard project={currentProject} />

        {/* Project Info */}
        <div className="rounded-lg shadow p-6 mb-6" style={{ backgroundColor: currentProject.color }}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              {currentProject.description ? (
                <p style={{ color: currentProject.textColor || '#FFFFFF' }}>{currentProject.description}</p>
              ) : (
                <p className="italic" style={{ color: currentProject.textColor || '#FFFFFF', opacity: 0.7 }}>No description yet. Complete the project setup to add one.</p>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditMetadataModalOpen(true)}
              invertedBgColor={currentProject.textColor}
              invertedTextColor={currentProject.color}
            >
              <Settings size={16} className="inline mr-2" />
              Edit
            </Button>
          </div>

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
          <div className="rounded-lg shadow p-6 mb-6" style={{ backgroundColor: currentProject.color }}>
            <h2 className="text-lg mb-4" style={{ color: currentProject.textColor || '#FFFFFF' }}>Documentation</h2>
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

        {/* Feedback Section - only show for projects past setup stages */}
        {!isSetupStatus(currentProject.status) && (
        <div className="rounded-lg shadow p-6" style={{ backgroundColor: currentProject.color }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg" style={{ color: currentProject.textColor || '#FFFFFF' }}>Feedback & Improvements</h2>
            <div className="flex gap-2">
              {feedback.filter(f => f.status === 'pending').length > 0 && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => handleCopyFixPrompt()}
                    invertedBgColor={currentProject.textColor}
                    invertedTextColor={currentProject.color}
                  >
                    <Copy size={18} className="inline mr-2" />
                    Copy Prompt
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleLaunchWithAllPending}
                    invertedBgColor={currentProject.textColor}
                    invertedTextColor={currentProject.color}
                  >
                    <Wrench size={18} className="inline mr-2" />
                    Fix
                  </Button>
                </>
              )}
              <Button
                onClick={handleAddFeedback}
                invertedBgColor={currentProject.textColor}
                invertedTextColor={currentProject.color}
              >
                <Plus size={18} className="inline mr-2" />
                Add
              </Button>
            </div>
          </div>

          {feedback.length === 0 ? (
            <div className="text-center py-12" style={{ color: currentProject.textColor || '#FFFFFF', opacity: 0.7 }}>
              <p>No feedback items yet.</p>
              <p className="mt-2">Click "Add Feedback" to create one.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending Items */}
              {feedback.filter(f => f.status === 'pending').sort((a, b) => a.priority - b.priority).length > 0 && (
                <div className="space-y-3">
                  {feedback
                    .filter(f => f.status === 'pending')
                    .sort((a, b) => a.priority - b.priority)
                    .map((item) => (
                      <div key={item.id} className="border-4 border-black rounded-lg p-4 bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 shadow-lg">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => handleToggleComplete(item.id)}
                            className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-white">{item.text}</p>
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
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Completed Items */}
              {feedback.filter(f => f.status === 'completed').length > 0 && (
                <div>
                  <h3 className="text-md mb-3" style={{ color: currentProject.textColor || '#FFFFFF' }}>Implemented</h3>
                  <div className="space-y-3">
                    {feedback
                      .filter(f => f.status === 'completed')
                      .sort((a, b) => a.priority - b.priority)
                      .map((item) => (
                        <div key={item.id} className="border-4 border-black rounded-lg p-4 bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 shadow-lg opacity-60">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={true}
                              onChange={() => handleToggleComplete(item.id)}
                              className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <p className="text-white line-through">{item.text}</p>
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
                          </div>
                        </div>
                      ))}
                  </div>
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
