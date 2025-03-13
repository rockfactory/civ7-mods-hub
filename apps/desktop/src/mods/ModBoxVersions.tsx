import * as React from 'react';
import { ModData, ModInfo } from '../home/IModInfo';
import { ModVersionsRecord } from '../pocketbase-types';
import { ActionIcon, Box, Table, Text } from '@mantine/core';
import { IconCircleCheckFilled, IconDownload } from '@tabler/icons-react';
import { DateFormatter } from '../ui/DateFormatter';

export interface IModBoxVersionsProps {
  mod: ModData;
  onInstall: (version: ModVersionsRecord) => void;
}

export function ModBoxVersions(props: IModBoxVersionsProps) {
  const { mod } = props;
  const modVersions = mod.fetched.expand?.mod_versions_via_mod_id;
  return (
    <Box>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Version</Table.Th>
            <Table.Th>Release date</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {modVersions?.map((version) => (
            <Table.Tr key={version.hash}>
              <Table.Td>{version.name}</Table.Td>
              <Table.Td>
                {DateFormatter.format(new Date(version.released || ''))}
              </Table.Td>
              <Table.Td align="right">
                {mod.local?.folder_hash == version.hash ? (
                  <ActionIcon color="green">
                    <IconCircleCheckFilled size={16} />
                  </ActionIcon>
                ) : (
                  <ActionIcon
                    color={mod.isUnknown ? 'grape' : 'blue'}
                    onClick={() => props.onInstall(version)}
                  >
                    <IconDownload size={16} />
                  </ActionIcon>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Box>
  );
}
