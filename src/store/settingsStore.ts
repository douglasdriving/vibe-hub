import { create } from 'zustand';
import type { Settings } from './types';
import * as tauri from '../services/tauri';

interface SettingsStore {
  // State
  settings: Settings | null;
  isLoading: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  updateProjectsDirectory: (path: string) => Promise<void>;
  selectDirectory: () => Promise<string | null>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  // Initial state
  settings: null,
  isLoading: false,

  // Load settings from backend
  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await tauri.getSettings();
      set({ settings, isLoading: false });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoading: false });
    }
  },

  // Update projects directory
  updateProjectsDirectory: async (path: string) => {
    const { settings } = useSettingsStore.getState();
    if (!settings) return;

    try {
      const newSettings = { ...settings, projectsDirectory: path };
      await tauri.updateSettings(newSettings);
      set({ settings: newSettings });
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  },

  // Open directory picker
  selectDirectory: async () => {
    try {
      const path = await tauri.selectDirectory();
      if (path) {
        await useSettingsStore.getState().updateProjectsDirectory(path);
      }
      return path;
    } catch (error) {
      console.error('Failed to select directory:', error);
      throw error;
    }
  },
}));
