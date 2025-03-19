import * as React from 'react';
import { useAppStore } from '../store/store';
import {
  ActionIcon,
  Button,
  ComboboxData,
  ComboboxItemGroup,
  Group,
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
import {
  IconAlertCircle,
  IconCards,
  IconCircleCheckFilled,
  IconCopyPlus,
  IconDots,
  IconPencil,
  IconPlayCard,
  IconPlayerPlayFilled,
  IconStack2,
} from '@tabler/icons-react';
import { EditProfilesModal } from './EditProfilesModal';

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
        items: [
          { value: '$duplicate', label: 'Duplicate current' },
          { value: '$edit', label: 'Edit profiles' },
        ],
      },
      {
        value: '$experimental',
        label: 'Experimental. Please backup your mods folder.',
      },
    ] as ComboboxData;
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

  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <Group gap={4}>
        <Select
          placeholder="Pick profile.."
          value={currentProfile}
          data={profileOptions}
          maw={300}
          miw={180}
          maxDropdownHeight={300}
          comboboxProps={{
            width: 300,
            position: 'bottom-start',
          }}
          leftSectionWidth={70}
          // rightSection={

          // }
          // rightSectionPointerEvents="auto"
          renderOption={(option) => {
            if (
              typeof option === 'object' &&
              option.option.value === '$experimental'
            ) {
              return (
                <Group wrap="nowrap" gap={2}>
                  <IconAlertCircle
                    color="var(--mantine-color-yellow-5)"
                    size={16}
                  />
                  <Text size="xs" c="yellow">
                    {option.option.label}
                  </Text>
                </Group>
              );
            }

            return (
              <Group gap={4}>
                {option.checked && (
                  <IconCircleCheckFilled
                    size={16}
                    color="var(--mantine-color-green-5)"
                  />
                )}
                {option.option.value === '$duplicate' && (
                  <IconCopyPlus size={16} />
                )}
                {option.option.value === '$edit' && <IconPencil size={16} />}
                <Text size="sm" c={option.checked ? 'green' : undefined}>
                  {option.option.label}
                </Text>
              </Group>
            );
          }}
          leftSection={
            <Group gap={2}>
              <IconCards size={16} />
              <Text size="xs" c="dimmed">
                Profile
              </Text>
            </Group>
          }
          searchable
          onChange={(value, option) => {
            if (option?.value === '$duplicate') {
              handleDuplicate();
            } else if (option?.value === '$edit') {
              setIsEditing(true);
            } else if (option?.value != null) {
              switchProfile(
                profiles?.find((p) => p.folderName === option.value)!
              );
            }
          }}
        />
      </Group>
      <DuplicateProfileModal
        profile={duplicatingProfile}
        onClose={() => setDuplicatingProfile(null)}
      />
      <EditProfilesModal isOpen={isEditing} close={() => setIsEditing(false)} />
    </>
  );
}
