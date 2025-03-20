import * as React from 'react';
import { useAppStore } from '../store/store';
import {
  ActionIcon,
  Button,
  Code,
  ComboboxData,
  ComboboxItemGroup,
  CopyButton,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
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
  IconCheck,
  IconCircleCheckFilled,
  IconCopy,
  IconCopyPlus,
  IconDots,
  IconPencil,
  IconPlayCard,
  IconPlayerPlayFilled,
  IconShare,
  IconStack2,
} from '@tabler/icons-react';
import { EditProfilesModal } from './EditProfilesModal';
import { generateProfileCode } from './generateProfileCode';
import { useModsContext } from '../mods/ModsContext';

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
          { value: '$share', label: 'Share profile' },
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

  const modsData = useModsContext().mods;

  const handleShare = useCallback(
    async (profile: ModProfile) => {
      let profileCode: string;
      try {
        profileCode = await generateProfileCode(modsData, profile);
      } catch (e) {
        console.error(e);
        notifications.show({
          withBorder: false,
          title: 'Failed to generate profile code',
          message: String(e),
          color: 'red',
        });
        return;
      }

      modals.open({
        title: 'Share profile',
        children: (
          <Stack>
            <Text size="sm">
              Share this profile Code with other players to let them install it
              directly.
            </Text>
            <Group wrap="nowrap">
              <Code>{profileCode}</Code>
              <CopyButton value={profileCode} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip
                    label={copied ? 'Copied' : 'Copy'}
                    withArrow
                    position="right"
                  >
                    <ActionIcon
                      color={copied ? 'teal' : 'gray'}
                      variant="subtle"
                      onClick={copy}
                    >
                      {copied ? (
                        <IconCheck size={16} />
                      ) : (
                        <IconCopy size={16} />
                      )}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
          </Stack>
        ),
      });
    },
    [modsData]
  );

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
                {option.option.value === '$share' && <IconShare size={16} />}
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
            switch (option?.value) {
              case '$duplicate':
                return handleDuplicate();
              case '$edit':
                return setIsEditing(true);
              case '$share':
                return handleShare(
                  profiles?.find((p) => p.folderName === currentProfile)!
                );
              default:
                return switchProfile(
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
