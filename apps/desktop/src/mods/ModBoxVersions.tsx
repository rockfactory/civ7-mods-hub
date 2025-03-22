import * as React from 'react';
import { ModData, ModInfo } from '../home/IModInfo';
import type { ModVersionsRecord } from '@civmods/parser';
import { ActionIcon, Box, LoadingOverlay, Table, Text } from '@mantine/core';
import { IconCircleCheckFilled, IconDownload } from '@tabler/icons-react';
import { DateFormatter } from '../ui/DateFormatter';
import { isSameVersion } from './isSameVersion';

export interface IModBoxVersionsProps {
  mod: ModData;
  onInstall: (version: ModVersionsRecord) => void;
  loading?: boolean;
}

function humanizeSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else {
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  }
}

export function ModBoxVersions(props: IModBoxVersionsProps) {
  const { mod } = props;
  if (!mod.fetched) {
    return null;
  }

  const modVersions = mod.fetched.expand?.mod_versions_via_mod_id;

  return (
    <Box mt="sm" pos="relative">
      <LoadingOverlay visible={props.loading} />
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Version</Table.Th>
            <Table.Th>Release date</Table.Th>
            <Table.Th>Size</Table.Th>
            <Table.Th align="right">Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {modVersions?.map((version) => (
            <Table.Tr key={version.id}>
              <Table.Td>{version.name}</Table.Td>
              <Table.Td>
                {DateFormatter.format(new Date(version.released || ''))}
              </Table.Td>
              <Table.Td>
                {version.archive_size
                  ? humanizeSize(version.archive_size)
                  : 'N/A'}
              </Table.Td>
              <Table.Td align="right">
                {isSameVersion(version, mod.local) ? (
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
