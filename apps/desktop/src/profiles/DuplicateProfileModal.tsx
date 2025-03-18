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
import { profile } from 'console';
import * as React from 'react';
import { useProfilesContext } from './ProfilesContext';
import { useEffect, useState } from 'react';
import { ModProfile } from './ModProfile';
import { useDisclosure } from '@mantine/hooks';

export interface IDuplicateProfileModalProps {
  profile: ModProfile | null;
  onClose: () => void;
}

export function DuplicateProfileModal(props: IDuplicateProfileModalProps) {
  const { profile } = props;
  const [isOpen, { toggle, open, close }] = useDisclosure();
  const { duplicateProfile } = useProfilesContext();
  const [title, setTitle] = useState('');

  const [isDuplicating, setIsDuplicating] = useState(false);

  useEffect(() => {
    if (profile) {
      setTitle(`${profile.title} (Copy)`);
      open();
    } else {
      close();
    }
  }, [profile]);

  return (
    <Modal
      opened={isOpen}
      closeOnClickOutside={!isDuplicating}
      closeOnEscape={!isDuplicating}
      title="Duplicate profile"
      onClose={() => {
        close();
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
              if (!profile) return;

              setIsDuplicating(true);
              duplicateProfile(profile, title)
                .then(() => {
                  close();
                  props.onClose();
                  notifications.show({
                    title: 'Profile duplicated',
                    message: 'Profile has been duplicated successfully',
                    color: 'blue',
                  });
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
