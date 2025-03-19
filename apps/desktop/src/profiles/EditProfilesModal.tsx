import {
  ActionIcon,
  Kbd,
  Modal,
  Table,
  TextInput,
  Tooltip,
} from '@mantine/core';
import * as React from 'react';
import { useAppStore } from '../store/store';
import { IconTrash } from '@tabler/icons-react';

export interface IEditProfilesModalProps {
  isOpen: boolean;
  close: () => void;
}

export function EditProfilesModal(props: IEditProfilesModalProps) {
  const { isOpen, close } = props;

  const profiles = useAppStore((state) => state.profiles);
  const current = useAppStore((state) => state.currentProfile);

  return (
    <Modal
      size={'lg'}
      opened={isOpen}
      title="Edit profiles"
      onClose={() => {
        close();
      }}
    >
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Profile</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th align="right">Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {profiles?.map((profile, index) => (
            <Table.Tr key={profile.folderName}>
              <Table.Td>
                <Kbd>{profile.folderName}</Kbd>
              </Table.Td>
              <Table.Td>
                <TextInput
                  size="xs"
                  defaultValue={profile.title}
                  onChange={(event) => {
                    useAppStore.getState().updateProfile(index, {
                      title: event.currentTarget.value,
                    });
                  }}
                  placeholder="Profile name"
                />
              </Table.Td>
              <Table.Td align="right">
                {/* <Tooltip
                  label={
                    current === profile.folderName
                      ? "Can't delete current profile"
                      : 'Delete profile'
                  }
                >
                  <ActionIcon
                    color="red"
                    variant="light"
                    onClick={() => {
                      if (current === profile.folderName) {
                        return;
                      }

                      useAppStore.getState().deleteProfile(index);
                    }}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip> */}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Modal>
  );
}
