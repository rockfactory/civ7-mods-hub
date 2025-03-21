import {
  Box,
  Button,
  LoadingOverlay,
  Modal,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import * as React from 'react';
import { useImportProfile } from './hooks/useImportProfile';
import { unhashProfileCodes } from '@civmods/parser';
import { useCallback, useState } from 'react';

export interface IImportProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportProfileModal(props: IImportProfileModalProps) {
  const { isOpen } = props;
  const { importProfile, cancelImport } = useImportProfile();
  const [title, setTitle] = useState('');

  const [profileCode, setProfileCode] = useState('');
  const [isValid, setIsValid] = useState(false);

  const [isImporting, setIsImporting] = useState(false);

  const handleChangeProfileCode = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProfileCode(event.currentTarget.value);
    try {
      const parsed = unhashProfileCodes(event.currentTarget.value);
      setTitle(parsed?.t ?? '');
      setIsValid(!!parsed);
    } catch (error) {
      setIsValid(false);
    }
  };

  const handleClose = useCallback(() => {
    if (isImporting) return;
    setProfileCode('');
    setIsValid(false);
    setTitle('');
    props.onClose();
  }, [cancelImport, isImporting, props]);

  const handleImport = useCallback(async () => {
    setIsImporting(true);
    try {
      await importProfile(title, profileCode);
      handleClose();
    } catch (error) {
      notifications.show({
        title: 'Error importing profile',
        message: String(error),
        color: 'red',
      });
    } finally {
      setIsImporting(false);
    }
  }, [importProfile, title, profileCode, handleClose]);

  return (
    <Modal
      opened={isOpen}
      closeOnClickOutside={!isImporting}
      closeOnEscape={!isImporting}
      title="Import profile"
      onClose={handleClose}
    >
      <Box pos="relative">
        {/** Start importing UI */}
        <Stack>
          <TextInput
            placeholder="Insert profile code..."
            onChange={handleChangeProfileCode}
          />
          {isValid && (
            <>
              <Text size="sm">Enter new profile title:</Text>
              <TextInput
                placeholder="Profile title..."
                value={title}
                onChange={(event) => setTitle(event.currentTarget.value)}
              />
              <Button color="blue" onClick={handleImport}>
                Import
              </Button>
            </>
          )}
        </Stack>
      </Box>
    </Modal>
  );
}
