import * as React from 'react';
import { useAppStore } from '../store/store';
import {
  ActionIcon,
  Box,
  Button,
  Code,
  ComboboxData,
  ComboboxItemGroup,
  CopyButton,
  Divider,
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
  IconExternalLink,
  IconPencil,
  IconPlayCard,
  IconPlayerPlayFilled,
  IconShare,
  IconTableImport,
} from '@tabler/icons-react';
import { EditProfilesModal } from './EditProfilesModal';
import { generateProfileCode } from './generateProfileCode';
import { useModsContext } from '../mods/ModsContext';
import { ImportProfileModal } from './ImportProfileModal';
import { ActionCopyButton } from './components/ActionCopyButton';

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
          { value: '$import', label: 'Import profile' },
        ],
      },
    ] as ComboboxData;
  }, [profiles]);

  const { switchProfile } = useProfilesContext();
  const modsData = useModsContext().mods;

  // == Duplicate profile ==
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleDuplicate = useCallback(() => {
    if (!currentProfile) return;
    const profile = profiles?.find((p) => p.folderName === currentProfile);
    if (!profile) return;

    setIsDuplicating(true);
  }, [currentProfile, profiles]);

  // == Share profile ==
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

      const link = `http://localhost:3000/profile?profileCode=${profileCode}`;

      modals.open({
        title: 'Share profile',
        children: (
          <Stack>
            <Text size="sm">
              Share the following link to let other players see and install this
              profile (and install CivMods) directly.
            </Text>
            <Group wrap="nowrap" w="100%" justify="space-between">
              <Button
                rightSection={<IconExternalLink size={16} />}
                component="a"
                color="teal"
                fullWidth
                href={link}
                target="_blank"
              >
                CivMods.com {profile.title} profile installation
              </Button>

              <ActionCopyButton value={link} title="Copy link" />
            </Group>
            <Divider mt="xs" label="Having issues?" />
            <Text size="sm">
              Share this profile Code directly with other players to let them
              install it
            </Text>
            <Group wrap="nowrap">
              <Code
                block
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {profileCode}
              </Code>
              <ActionCopyButton value={profileCode} title="Copy code" />
            </Group>
          </Stack>
        ),
      });
    },
    [modsData]
  );

  // == Import Profile ==
  const [isImporting, setIsImporting] = useState(false);

  // == Edit profiles (open modal) ==
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
          maxDropdownHeight={400}
          comboboxProps={{
            width: 300,
            position: 'bottom-start',
          }}
          leftSectionWidth={70}
          renderOption={(option) => {
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
                {option.option.value === '$import' && (
                  <IconTableImport size={16} />
                )}
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
              case '$import':
                return setIsImporting(true);
              default:
                return switchProfile(
                  profiles?.find((p) => p.folderName === option.value)!
                );
            }
          }}
        />
      </Group>
      <DuplicateProfileModal
        isOpen={isDuplicating}
        onClose={() => setIsDuplicating(false)}
      />
      <EditProfilesModal isOpen={isEditing} close={() => setIsEditing(false)} />
      <ImportProfileModal isOpen={isImporting} setOpen={setIsImporting} />
    </>
  );
}
