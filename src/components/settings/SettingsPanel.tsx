import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Folder } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { Button } from '../common/Button';
import { APP_NAME } from '../../utils/constants';

export function SettingsPanel() {
  const navigate = useNavigate();
  const { settings, selectDirectory } = useSettingsStore();

  const handleSelectDirectory = async () => {
    try {
      await selectDirectory();
    } catch (error) {
      console.error('Failed to select directory:', error);
    }
  };

  const handleBack = () => {
    navigate('/');
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
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
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
      </main>
    </div>
  );
}
