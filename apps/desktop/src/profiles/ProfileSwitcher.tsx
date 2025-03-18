import * as React from 'react';
import { useAppStore } from '../store/store';
import {
  Button,
  ComboboxItemGroup,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useCallback, useMemo, useState } from 'react';
import { useProfilesContext } from './ProfilesContext';
import { modals, openConfirmModal } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { DuplicateProfileModal } from './DuplicateProfileModal';
import { ModProfile } from './ModProfile';

export interface IProfileSwitcherProps {}

export function ProfileSwitcher(props: IProfileSwitcherProps) {
  const currentProfile = useAppStore((state) => state.currentProfile);
  const profiles = useAppStore((state) => state.profiles);

  const profileOptions = useMemo(() => {
    return [
      {
        group: 'Profiles',
        items:
          profiles?.map((profile) => ({
            value: profile.folderName,
            label: profile.title,
          })) ?? [],
      },
      {
        group: 'Actions',
        items: [{ value: 'duplicate', label: 'Duplicate current' }],
      },
    ] as ComboboxItemGroup[];
  }, [profiles]);

  const { switchProfile } = useProfilesContext();

  const [duplicatingProfile, setDuplicatingProfile] = useState(
    null as ModProfile | null
  );
  const handleDuplicate = useCallback(() => {
    if (!currentProfile) return;
    const profile = profiles?.find((p) => p.folderName === currentProfile);
    if (!profile) return;

    setDuplicatingProfile(profile);
  }, [currentProfile, profiles]);

  return (
    <>
      <Select
        placeholder="Pick profile.."
        value={currentProfile}
        data={profileOptions}
        searchable
        onChange={(value, option) => {
          if (option?.value === 'duplicate') {
            handleDuplicate();
          } else if (option?.value != null) {
            switchProfile(
              profiles?.find((p) => p.folderName === option.value)!
            );
          }
        }}
      />
      <DuplicateProfileModal
        profile={duplicatingProfile}
        onClose={() => setDuplicatingProfile(null)}
      />
    </>
  );
}
