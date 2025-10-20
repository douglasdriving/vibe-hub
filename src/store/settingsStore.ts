import { create } from 'zustand';
import type { Settings } from './types';
import * as tauri from '../services/tauri';
import { soundEffects } from '../utils/sounds';

interface SettingsStore {
  // State
  settings: Settings | null;
  isLoading: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  updateProjectsDirectory: (path: string) => Promise<void>;
  updateSoundEffectsEnabled: (enabled: boolean) => Promise<void>;
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
      console.log('Loading settings...');
      const settings = await tauri.getSettings();
      console.log('Settings loaded:', settings);

      // Apply sound effects setting
      soundEffects.setEnabled(settings.soundEffectsEnabled ?? true);

      set({ settings, isLoading: false });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoading: false });
    }
  },

  // Update projects directory
  updateProjectsDirectory: async (path: string) => {
    const { settings } = useSettingsStore.getState();
    console.log('Updating projects directory to:', path);
    console.log('Current settings:', settings);

    // If no settings exist, create new one
    const currentSettings = settings || { projectsDirectory: '', soundEffectsEnabled: true };

    try {
      const newSettings = { ...currentSettings, projectsDirectory: path };
      console.log('Saving settings:', newSettings);
      await tauri.updateSettings(newSettings);
      console.log('Settings saved successfully');
      set({ settings: newSettings });
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  },

  // Update sound effects enabled
  updateSoundEffectsEnabled: async (enabled: boolean) => {
    const { settings } = useSettingsStore.getState();
    const currentSettings = settings || { projectsDirectory: '', soundEffectsEnabled: true };

    try {
      const newSettings = { ...currentSettings, soundEffectsEnabled: enabled };
      await tauri.updateSettings(newSettings);
      soundEffects.setEnabled(enabled);
      set({ settings: newSettings });
    } catch (error) {
      console.error('Failed to update sound effects setting:', error);
      throw error;
    }
  },

  // Open directory picker
  selectDirectory: async () => {
    try {
      console.log('Opening directory picker...');
      const path = await tauri.selectDirectory();
      console.log('Selected path:', path);
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
