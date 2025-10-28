import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Folder, FileText } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { Button } from '../common/Button';
import { APP_NAME } from '../../utils/constants';
import * as tauri from '../../services/tauri';

export function SettingsPanel() {
  const navigate = useNavigate();
  const { settings, selectDirectory, updateSoundEffectsEnabled, updateLaunchOnStartup } = useSettingsStore();

  const handleSelectDirectory = async () => {
    try {
      const path = await selectDirectory();
      // Navigate back to dashboard after successful directory selection
      if (path) {
        navigate('/');
      }
    } catch {
      // Silently handle error
    }
  };

  const handleToggleSoundEffects = async () => {
    try {
      await updateSoundEffectsEnabled(!settings?.soundEffectsEnabled);
    } catch {
      // Silently handle error
    }
  };

  const handleToggleLaunchOnStartup = async () => {
    try {
      await updateLaunchOnStartup(!settings?.launchOnStartup);
    } catch {
      // Silently handle error
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleOpenDebugLog = async () => {
    try {
      const logPath = await tauri.getDebugLogPath();
      alert(`Debug log location:\n${logPath}\n\nOpening in Explorer...`);
      // Open the temp folder
      const tempDir = logPath.substring(0, logPath.lastIndexOf('\\'));
      await tauri.openInExplorer(tempDir);
    } catch (error) {
      alert(`Failed to get debug log path: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-purple-700 uppercase" style={{ textShadow: '2px 2px 0px rgba(0,0,0,1)' }}>Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Projects Directory
          </h2>

          <p className="text-gray-600 text-sm mb-4">
            Select the folder where your {APP_NAME} projects are stored. Each
            subfolder should be a separate project with a git repository.
          </p>

          {settings?.projectsDirectory ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Directory
              </label>
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 font-mono text-sm text-gray-800">
                {settings.projectsDirectory}
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-gray-600 text-sm">
                No projects directory configured yet.
              </p>
            </div>
          )}

          <Button onClick={handleSelectDirectory}>
            <Folder size={18} className="inline mr-2" />
            {settings?.projectsDirectory
              ? 'Change Directory'
              : 'Select Directory'}
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Sound Effects
          </h2>

          <p className="text-gray-600 text-sm mb-4">
            Enable or disable sound effects for button clicks, hovers, and interactions.
          </p>

          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={settings?.soundEffectsEnabled ?? true}
                onChange={handleToggleSoundEffects}
                className="sr-only"
              />
              <div className={`block w-14 h-8 rounded-full transition-colors ${
                settings?.soundEffectsEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}></div>
              <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                settings?.soundEffectsEnabled ? 'transform translate-x-6' : ''
              }`}></div>
            </div>
            <div className="ml-3 text-gray-700 font-medium">
              {settings?.soundEffectsEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </label>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Startup
          </h2>

          <p className="text-gray-600 text-sm mb-4">
            Launch {APP_NAME} automatically when Windows starts. This is useful if you use the app daily.
          </p>

          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={settings?.launchOnStartup ?? false}
                onChange={handleToggleLaunchOnStartup}
                className="sr-only"
              />
              <div className={`block w-14 h-8 rounded-full transition-colors ${
                settings?.launchOnStartup ? 'bg-blue-600' : 'bg-gray-300'
              }`}></div>
              <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                settings?.launchOnStartup ? 'transform translate-x-6' : ''
              }`}></div>
            </div>
            <div className="ml-3 text-gray-700 font-medium">
              {settings?.launchOnStartup ? 'Enabled' : 'Disabled'}
            </div>
          </label>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Debug
          </h2>

          <p className="text-gray-600 text-sm mb-4">
            View debug logs to troubleshoot issues with Claude Code launcher and other features.
          </p>

          <Button onClick={handleOpenDebugLog} variant="secondary">
            <FileText size={18} className="inline mr-2" />
            Open Debug Log
          </Button>
        </div>
      </main>
    </div>
  );
}
