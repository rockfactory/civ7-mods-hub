import * as React from 'react';
import { FetchedMod } from './ModBox';
import { ModInfo } from '../home/IModInfo';
import { ModVersionsRecord } from '../pocketbase-types';
import { ActionIcon, Box, Table, Text } from '@mantine/core';
import { IconCircleCheckFilled, IconDownload } from '@tabler/icons-react';

export interface IModBoxVersionsProps {
  mod: FetchedMod;
  installedVersion?: ModVersionsRecord;
  modInfo: ModInfo | undefined;
}

export function ModBoxVersions(props: IModBoxVersionsProps) {
  const { mod, installedVersion, modInfo } = props;
  const modVersions = mod.expand?.mod_versions_via_mod_id;
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
              <Table.Td>{version.released}</Table.Td>
              <Table.Td>
                {installedVersion?.hash == version.hash ? (
                  <ActionIcon color="green">
                    <IconCircleCheckFilled size={16} />
                  </ActionIcon>
                ) : (
                  <ActionIcon color="blue">
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
