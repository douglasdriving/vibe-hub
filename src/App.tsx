import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/dashboard/Dashboard';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { ProjectDetail } from './components/project/ProjectDetail';
import { useSettingsStore } from './store/settingsStore';

function App() {
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    // Load settings on app start
    loadSettings();
  }, [loadSettings]);

  return (
    <div className="px-16 sm:px-24 lg:px-32">
      <HashRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<SettingsPanel />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
        </Routes>
      </HashRouter>
    </div>
  );
}

export default App;
