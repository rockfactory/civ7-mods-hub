import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ModsResponse, ModVersionsRecord } from '@civmods/parser';
import { FetchedMod, ModData, ModInfo } from '../home/IModInfo';
import { invoke } from '@tauri-apps/api/core';
import { sortVersionsByDate } from './fetchMods';
import { TypedPocketBase } from '@civmods/parser';
import PocketBase, { ClientResponseError } from 'pocketbase';
import { useAppStore } from '../store/store';
import { installMod, runLowLevelInstallMod, uninstallMod } from './installMod';
import { notifications } from '@mantine/notifications';
import { open } from '@tauri-apps/plugin-dialog';
import { isSameVersion } from './isSameVersion';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { openConfirmModal } from '@mantine/modals';
import { getActiveModsFolder } from './getModsFolder';
import { invokeScanCivMods } from './commands/modsRustBindings';
import { computeModsData } from './commands/computeModsData';

const pb = new PocketBase(
  'https://backend.civmods.com'
  /*'http://localhost:8090'*/
) as TypedPocketBase;

export type ModsContextType = {
  mods: ModData[];
  fetchedMods: FetchedMod[];
  uninstall: (mod: ModData) => Promise<void>;
  install: (mod: ModData, version: ModVersionsRecord) => Promise<void>;
  triggerReload: () => void;
  chooseModFolder: () => Promise<void>;
  getModsFolder: () => Promise<string | null>;
  isFetching: boolean;
  isLoadingInstalled: boolean;
};

export const ModsContext = createContext({} as ModsContextType);

export function ModsContextProvider(props: { children: React.ReactNode }) {
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedMods, setFetchedMods] = useState<FetchedMod[]>([]);

  const [isLoadingInstalled, setIsLoadingInstalled] = useState(false);
  const [modsInfo, setModsInfo] = useState<ModInfo[]>([]);
  const [reloadIndex, setReloadIndex] = useState(0);

  const getModsFolder = useCallback(async () => {
    return await getActiveModsFolder();
  }, []);

  const currentProfile = useAppStore((state) => state.currentProfile);

  /**
   * Update local mods list
   */
  useEffect(() => {
    async function findMods() {
      setIsLoadingInstalled(true);
      const folder = await getModsFolder();
      console.log('Mods folder:', folder);

      try {
        // Missing mods folder error is handled in rust bindings
        const modsInfo = await invokeScanCivMods(folder!);

        setModsInfo(modsInfo);
        console.log(
          'Mods info:',
          modsInfo.map((m) => m.modinfo_id)
        );
      } catch (error) {
        console.error('Failed to scan mods:', error);
        notifications.show({
          color: 'red',
          title: 'Failed to scan mods',
          message: String(error),
        });
      }
      setIsLoadingInstalled(false);
    }

    findMods().catch(console.error);
  }, [reloadIndex, currentProfile]);

  /**
   * Update remote mods list
   */
  useEffect(() => {
    async function fetchMods() {
      setIsFetching(true);
      try {
        const records = await pb.collection('mods').getFullList<FetchedMod>({
          filter: 'cf_id != "32088"',
          expand: 'mod_versions_via_mod_id',
          sort: '-mod_updated',
        });

        const data = records.map((record) => {
          return {
            ...record,
            expand: {
              ...record.expand,
              mod_versions_via_mod_id: sortVersionsByDate(
                record.expand?.mod_versions_via_mod_id ?? []
              ),
            },
          };
        });

        console.log('Mods data:', data.length);
        setFetchedMods(data ?? []);
      } catch (error) {
        if (error instanceof ClientResponseError && error.isAbort) {
          console.log('Request aborted');
        } else {
          console.error('Failed to fetch mods:', error);
          notifications.show({
            color: 'red',
            title: 'Failed to fetch mods',
            message: String(error),
            autoClose: 10000,
          });
        }
      }
      setIsFetching(false);
    }

    fetchMods();
  }, [reloadIndex]);

  /**
   * Map fetched mods to local mods
   */
  const mods = useMemo(() => {
    return computeModsData({
      fetchedMods,
      modsInfo,
    });
  }, [fetchedMods, modsInfo]);

  const triggerReload = useCallback(() => {
    setReloadIndex((prev) => prev + 1);
  }, []);

  /**
   * Uninstall mod.
   * Handles notifications
   */
  const uninstall = useCallback(
    async (mod: ModData) => {
      if (!mod.local) {
        notifications.show({
          color: 'red',
          title: 'Failed to uninstall mod',
          message: 'Local mod data not found',
        });
        return;
      }

      try {
        await uninstallMod(mod.local);
      } catch (error) {
        notifications.show({
          color: 'red',
          title: 'Failed to uninstall mod',
          message: String(error),
        });
      } finally {
        triggerReload();
      }
    },
    [getModsFolder, triggerReload]
  );

  /**
   * Install mod with specific version.
   * Handles notifications
   */
  const install = useCallback(
    async (mod: ModData, version: ModVersionsRecord) => {
      try {
        await installMod(mod, version);

        triggerReload();

        notifications.show({
          color: 'green',
          title: 'Mod installed',
          message: `${mod.name} ${version.name} installed successfully`,
        });
      } catch (error) {
        notifications.show({
          color: 'red',
          title: 'Failed to install mod',
          message: String(error),
        });
      }
    },
    [triggerReload]
  );

  const chooseModFolder = useCallback(async () => {
    try {
      const selectedFolder = await open({
        directory: true, // Enables folder selection
        multiple: false, // Allows only a single folder selection
        defaultPath:
          (await invoke<string | null>('get_mods_folder', {})) ?? undefined,
      });

      if (selectedFolder) {
        console.log('Selected folder:', selectedFolder);
        useAppStore.setState({ modFolder: selectedFolder });
        triggerReload();
      } else {
        console.log('No folder selected');
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      notifications.show({
        color: 'red',
        title: 'Failed to select Mods folder',
        message: String(error),
      });
    }
  }, []);

  const value = useMemo(
    () => ({
      mods,
      install,
      uninstall,
      triggerReload,
      chooseModFolder,
      isFetching,
      isLoadingInstalled,
      getModsFolder,
      fetchedMods,
    }),
    [
      mods,
      install,
      uninstall,
      triggerReload,
      chooseModFolder,
      isFetching,
      isLoadingInstalled,
      getModsFolder,
      fetchedMods,
    ]
  );

  return (
    <ModsContext.Provider value={value}>{props.children}</ModsContext.Provider>
  );
}

export const useModsContext = () => {
  return useContext(ModsContext);
};
