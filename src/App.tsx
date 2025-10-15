import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<SettingsPanel />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
