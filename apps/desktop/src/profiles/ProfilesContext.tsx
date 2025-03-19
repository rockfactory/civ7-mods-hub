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
import { TypedPocketBase } from '../pocketbase-types';
import PocketBase, { ClientResponseError } from 'pocketbase';
import { useAppStore } from '../store/store';
import { notifications } from '@mantine/notifications';
import { open } from '@tauri-apps/plugin-dialog';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { modals, openConfirmModal } from '@mantine/modals';
import {
  copyModsToProfile,
  invokeDeleteProfile,
  listProfiles,
  restoreModsFromProfile,
} from './profileRustBindings';
import { getActiveModsFolder } from '../mods/getModsFolder';
import { ModProfile } from './ModProfile';
import { kebabCase, snakeCase } from 'es-toolkit';
import { Center, Loader, Text } from '@mantine/core';

const pb = new PocketBase(
  'https://backend.civmods.com'
  /*'http://localhost:8090'*/
) as TypedPocketBase;

export type ProfilesContextType = {
  switchProfile: (profile: ModProfile) => Promise<void>;
  duplicateProfile: (profile: ModProfile, title: string) => Promise<void>;
  deleteProfile: (profile: ModProfile) => Promise<void>;
};

export const ProfilesContext = createContext({} as ProfilesContextType);

export function ProfilesContextProvider(props: { children: React.ReactNode }) {
  const [reloadIndex, setReloadIndex] = useState(0);

  useEffect(() => {
    async function findProfiles() {
      const currentState = useAppStore.getState();

      const available = await listProfiles();
      console.log('Available profiles:', available);
      const saved = currentState.profiles ? [...currentState.profiles] : [];
      let next = saved; /*.filter((profile) =>
        available.includes(profile.folderName)
      );*/

      // Add new profiles to the store
      available.forEach((profile) => {
        if (!next.find((p) => p.folderName === profile)) {
          next.push({
            folderName: profile,
            title: profile,
          });
        }
      });

      if (next.length === 0) {
        next.push({
          folderName: 'default',
          title: 'Default',
        });
      }

      useAppStore.getState().setProfiles(next);

      if (
        currentState.currentProfile == null ||
        !next.find((p) => p.folderName === currentState.currentProfile)
      ) {
        useAppStore.getState().setCurrentProfile(next[0].folderName);
      }
    }

    findProfiles().catch((e) => {
      console.error(e);
      notifications.show({
        withBorder: false,
        title: 'Error',
        message: 'Failed to list profiles',
        color: 'red',
      });
    });
  }, [reloadIndex]);

  const switchProfile = useCallback(async (profile: ModProfile) => {
    const previous = useAppStore.getState().currentProfile;
    if (previous === profile.folderName) {
      return;
    }

    if (!previous) {
      notifications.show({
        withBorder: false,
        title: 'Error',
        message: 'Failed to get previous profile',
        color: 'red',
      });
      return;
    }

    const modsFolder = await getActiveModsFolder();
    if (modsFolder == null) {
      notifications.show({
        withBorder: false,
        title: 'Error',
        message: 'Failed to get active mods folder',
        color: 'red',
      });
      return;
    }

    let loadingId = modals.open({
      title: 'Switching profile...',
      size: 'sm',
      children: (
        <Center>
          <Loader />
        </Center>
      ),
    });

    try {
      // 1. Dry-Run to check if the mods can be copied
      await restoreModsFromProfile(modsFolder, profile.folderName, true);

      const lockedIds = useAppStore.getState().lockedModIds ?? [];
      await copyModsToProfile(
        await getActiveModsFolder(),
        lockedIds,
        previous,
        true
      );

      await restoreModsFromProfile(modsFolder, profile.folderName);

      useAppStore.getState().setCurrentProfile(profile.folderName);
    } catch (e) {
      console.error(e);
      notifications.show({
        withBorder: false,
        title: 'Failed to switch profile',
        message: String(e),
        color: 'red',
      });
    } finally {
      modals.close(loadingId);
    }
  }, []);

  const duplicateProfile = useCallback(
    async (profile: ModProfile, title: string) => {
      const modsFolder = await getActiveModsFolder();
      if (modsFolder == null) {
        notifications.show({
          withBorder: false,
          title: 'Error',
          message: 'Failed to get active mods folder',
          color: 'red',
        });
        return;
      }

      const folderName = kebabCase(title.replace(/[^\w\s]/gi, ''));
      console.log('Duplicating profile:', profile.folderName, 'to', folderName);
      // If it already exists in appData dir, don't duplicate and show error
      const existing = useAppStore
        .getState()
        .profiles?.find((p) => p.folderName === folderName);
      if (existing) {
        notifications.show({
          withBorder: false,
          title: 'Error',
          message: `Cannot create profile "${title}", found folder with similar name "${folderName}"`,
          color: 'red',
        });
        return;
      }

      const lockedIds = useAppStore.getState().lockedModIds ?? [];
      await copyModsToProfile(modsFolder, lockedIds, profile.folderName, false);

      useAppStore.getState().addProfile({
        folderName,
        title,
      });
      useAppStore.getState().setCurrentProfile(folderName);

      setReloadIndex((i) => i + 1);

      notifications.show({
        withBorder: false,
        title: 'Profile duplicated',
        message: 'Profile has been duplicated successfully',
        color: 'green',
      });
    },
    []
  );

  const deleteProfile = useCallback(
    async (profile: ModProfile) => {
      if (useAppStore.getState().currentProfile === profile.folderName) {
        console.error('Cannot delete current profile', profile.folderName);
        notifications.show({
          withBorder: false,
          title: 'Error',
          message: 'Cannot delete current profile',
          color: 'red',
        });
        return;
      }

      openConfirmModal({
        title: 'Delete profile',
        children: (
          <Text>
            Are you sure you want to delete profile <b>{profile.title}</b>?
          </Text>
        ),
        labels: {
          cancel: 'Cancel',
          confirm: 'Delete profile',
        },
        onConfirm: async () => {
          try {
            await invokeDeleteProfile(profile.folderName);
            useAppStore
              .getState()
              .setProfiles(
                useAppStore
                  .getState()
                  .profiles?.filter(
                    (p) => p.folderName !== profile.folderName
                  ) ?? []
              );
          } catch (e) {
            console.error(e);
            notifications.show({
              withBorder: false,
              title: 'Failed to delete profile',
              message: String(e),
              color: 'red',
            });
            return;
          } finally {
            setReloadIndex((i) => i + 1);
          }

          notifications.show({
            title: 'Profile deleted',
            message: 'Profile has been deleted successfully',
            color: 'green',
          });
        },
      });
    },
    [setReloadIndex]
  );

  const value = useMemo(
    () => ({ switchProfile, duplicateProfile, deleteProfile }),
    [switchProfile, duplicateProfile, deleteProfile]
  );

  return (
    <ProfilesContext.Provider value={value}>
      {props.children}
    </ProfilesContext.Provider>
  );
}

export const useProfilesContext = () => useContext(ProfilesContext);
