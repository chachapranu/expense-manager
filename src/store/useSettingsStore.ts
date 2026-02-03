import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'expense-manager-settings';

interface SettingsState {
  isDarkMode: boolean;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  toggleDarkMode: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  isDarkMode: false,
  isLoaded: false,

  loadSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        set({ isDarkMode: settings.isDarkMode ?? false, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  toggleDarkMode: async () => {
    const newValue = !get().isDarkMode;
    set({ isDarkMode: newValue });
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ isDarkMode: newValue }));
    } catch {
      // Silently fail
    }
  },
}));
