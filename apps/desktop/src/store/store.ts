import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { LazyStore, Store } from '@tauri-apps/plugin-store';

const persistStore = new LazyStore('civStorage.json', { autoSave: true });

const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
      console.log(name)
      return (await persistStore.get(name)) || null
  },
  setItem: async (name: string, value: string): Promise<void> => {
      console.log(name, value)
      await persistStore.set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
      console.log(name)
      await persistStore.delete(name)
  },
}

export type AppState = {
  modFolder: string | null,
  setModFolder: (folder: string) => void,
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      modFolder: null,
      setModFolder: (folder: string) => set({ modFolder: folder }),
    }),
    {
      name: 'civ-app-store',
      storage: createJSONStorage(() => storage),
    },
  ),
)