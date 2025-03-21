import {
  Box,
  Button,
  LoadingOverlay,
  Modal,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import * as React from 'react';
import { useProfilesContext } from './ProfilesContext';
import { useEffect, useState } from 'react';
import { ModProfile } from './ModProfile';
import { useDisclosure } from '@mantine/hooks';
import { useAppStore } from '../store/store';

export interface IDuplicateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DuplicateProfileModal(props: IDuplicateProfileModalProps) {
  const { isOpen } = props;
  const { createNewProfileWithNotifications } = useProfilesContext();
  const [title, setTitle] = useState('');

  const [isDuplicating, setIsDuplicating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const profile = useAppStore
        .getState()
        .profiles?.find(
          (p) => p.folderName === useAppStore.getState().currentProfile
        );
      setTitle(`${profile?.title ?? ''} (Copy)`);
    }
  }, [isOpen]);

  return (
    <Modal
      opened={isOpen}
      closeOnClickOutside={!isDuplicating}
      closeOnEscape={!isDuplicating}
      title="Duplicate profile"
      onClose={() => {
        props.onClose();
      }}
    >
      <Box pos="relative">
        <LoadingOverlay visible={isDuplicating} />
        <Stack>
          <Text size="sm">Enter new profile title:</Text>
          <TextInput
            placeholder="Profile title..."
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
          />
          <Button
            color="blue"
            onClick={() => {
              if (!title) return;
              setIsDuplicating(true);
              createNewProfileWithNotifications({
                title,
                shouldDuplicate: true,
              })
                .then(() => {
                  props.onClose();
                })
                .catch((error) => {
                  notifications.show({
                    title: 'Error duplicating profile',
                    message: String(error),
                    color: 'red',
                  });
                })
                .finally(() => {
                  setIsDuplicating(false);
                });
            }}
          >
            Duplicate
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
}
