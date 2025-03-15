import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ModsResponse, ModVersionsRecord } from '../pocketbase-types';
import { FetchedMod, ModData, ModInfo } from '../home/IModInfo';
import { invoke } from '@tauri-apps/api/core';
import { sortVersionsByDate } from './fetchMods';
import { TypedPocketBase } from '../pocketbase-types';
import PocketBase, { ClientResponseError } from 'pocketbase';
import { useAppStore } from '../store/store';
import { installMod, uninstallMod } from './installMod';
import { notifications } from '@mantine/notifications';
import { open } from '@tauri-apps/plugin-dialog';
import { isSameVersion } from './isSameVersion';

const pb = new PocketBase(
  'https://backend.civmods.com'
  /*'http://localhost:8090'*/
) as TypedPocketBase;

export type ModsContextType = {
  mods: ModData[];
  uninstall: (mod: ModData) => Promise<void>;
  install: (mod: ModData, version: ModVersionsRecord) => Promise<void>;
  triggerReload: () => void;
  chooseModFolder: () => Promise<void>;
  getModsFolder: () => Promise<string>;
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
    return (
      useAppStore.getState().modFolder ||
      (await invoke<string>('get_mods_folder', {}))
    );
  }, []);

  /**
   * Update local mods list
   */
  useEffect(() => {
    async function findMods() {
      setIsLoadingInstalled(true);
      const folder = await getModsFolder();
      console.log('Mods folder:', folder);

      try {
        const modsInfo = await invoke<ModInfo[]>('scan_civ_mods', {
          modsFolderPath: folder,
        });

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
  }, [reloadIndex]);

  /**
   * Update remote mods list
   */
  useEffect(() => {
    async function fetchMods() {
      setIsFetching(true);
      try {
        const records = await pb.collection('mods').getFullList<FetchedMod>({
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
        setFetchedMods(data);
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
    return fetchedMods.map((fetchedMod) => {
      const local = modsInfo.find(
        (info) =>
          info.modinfo_id ===
          fetchedMod.expand?.mod_versions_via_mod_id[0].modinfo_id
      );

      const installedVersion = fetchedMod.expand?.mod_versions_via_mod_id.find(
        (version) => isSameVersion(version, local)
      );

      return {
        fetched: fetchedMod,
        local,
        installedVersion,
        isUnknown: !installedVersion && local != null,
      } as ModData;
    });
  }, [fetchedMods, modsInfo]);

  const triggerReload = useCallback(() => {
    setReloadIndex((prev) => prev + 1);
  }, []);

  /**
   * Uninstall mod
   */
  const uninstall = useCallback(
    async (mod: ModData) => {
      if (!mod.local) {
        throw new Error('Mod is not installed');
      }

      const folder = await getModsFolder();
      await uninstallMod(mod.local, folder);
      triggerReload();
    },
    [getModsFolder, triggerReload]
  );

  /**
   * Install mod with specific version
   */
  const install = useCallback(
    async (mod: ModData, version: ModVersionsRecord) => {
      if (!version?.download_url) {
        throw new Error(
          `Mod ${mod.fetched.name} v: ${version?.name} has no download URL`
        );
      }

      const modsFolder = await getModsFolder();

      try {
        if (mod.local != null) {
          await uninstallMod(mod.local, modsFolder);
        }
        await installMod(version, { modsFolderPath: modsFolder });
        triggerReload();

        notifications.show({
          color: 'green',
          title: 'Mod installed',
          message: `${mod.fetched.name} ${version.name} installed successfully`,
        });
      } catch (error) {
        console.error('Failed to install mod:', error);
        notifications.show({
          color: 'red',
          title: 'Failed to install mod',
          message: String(error),
        });
      }
    },
    [triggerReload, getModsFolder]
  );

  const chooseModFolder = useCallback(async () => {
    try {
      const selectedFolder = await open({
        directory: true, // Enables folder selection
        multiple: false, // Allows only a single folder selection
        defaultPath: await invoke<string>('get_mods_folder', {}),
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
    ]
  );

  return (
    <ModsContext.Provider value={value}>{props.children}</ModsContext.Provider>
  );
}

export const useModsContext = () => {
  return useContext(ModsContext);
};
