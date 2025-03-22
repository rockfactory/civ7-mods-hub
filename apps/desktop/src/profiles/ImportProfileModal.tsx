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
import { useCallback, useEffect, useState } from 'react';
import {
  DeepLinkActivations,
  useDeepLinkActivation,
} from '../mods/deep-links/registerDeepLink';

export interface IImportProfileModalProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

export function ImportProfileModal(props: IImportProfileModalProps) {
  const { isOpen } = props;
  const { importProfile, cancelImport } = useImportProfile();
  const [title, setTitle] = useState('');

  const [profileCode, setProfileCode] = useState('');
  const [modsCount, setModsCount] = useState(0);
  const [isValid, setIsValid] = useState(false);

  const [isImporting, setIsImporting] = useState(false);

  const handleChangeProfileCode = (
    event: React.ChangeEvent<HTMLInputElement> | string
  ) => {
    const value = typeof event === 'string' ? event : event.currentTarget.value;
    setProfileCode(value);
    try {
      const parsed = unhashProfileCodes(value);
      setTitle(parsed?.t ?? '');
      setModsCount(parsed?.ms?.length ?? 0);
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
    setModsCount(0);
    props.setOpen(false);
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

  /**
   * Handle deep link activation to import profile
   */
  const trigger = useDeepLinkActivation('profile');
  useEffect(() => {
    const deepLink = DeepLinkActivations.profile.shift();
    if (!deepLink) return;

    const params = new URLSearchParams(deepLink.url.split('?').pop());
    const deepLinkProfileCode = params.get('profileCode');

    if (!deepLinkProfileCode) {
      notifications.show({
        title: 'Invalid profile code',
        message: 'Profile code is missing',
        color: 'red',
      });
      return;
    }

    props.setOpen(true);
    handleChangeProfileCode(deepLinkProfileCode);
  }, [trigger, props.setOpen]);

  return (
    <Modal
      opened={isOpen}
      closeOnClickOutside={!isImporting}
      closeOnEscape={!isImporting}
      title="Import profile"
      onClose={handleClose}
      zIndex={201} // Higher than ShareProfileModal
    >
      <Box pos="relative">
        {/** Start importing UI */}
        <Stack>
          <TextInput
            placeholder="Insert profile code..."
            value={profileCode}
            onChange={handleChangeProfileCode}
          />
          {isValid && (
            <>
              <Text size="sm" c="dimmed">
                Will install a new profile with {modsCount} mods.
                <br /> See the full list on the{' '}
                <a
                  href={`https://civmods.com/profile?profileCode=${profileCode}`}
                  target="_blank"
                >
                  CivMods.com Page
                </a>
              </Text>
              <Text size="sm">Enter new profile title:</Text>
              <TextInput
                placeholder="Profile title..."
                value={title}
                onChange={(event) => setTitle(event.currentTarget.value)}
              />
              <Button
                color="blue"
                onClick={handleImport}
                disabled={modsCount === 0}
              >
                {modsCount === 0 ? 'No mods to import' : 'Import'}
              </Button>
            </>
          )}
        </Stack>
      </Box>
    </Modal>
  );
}
