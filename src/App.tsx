import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/dashboard/Dashboard';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { ProjectDetail } from './components/project/ProjectDetail';
import { Sidebar } from './components/common/Sidebar';
import { useSettingsStore } from './store/settingsStore';

function App() {
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    // Load settings on app start
    loadSettings();
  }, [loadSettings]);

  return (
    <HashRouter>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-2 sm:px-4 lg:px-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/settings" element={<SettingsPanel />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
            </Routes>
          </div>
        </div>
      </div>
    </HashRouter>
  );
}

export default App;
