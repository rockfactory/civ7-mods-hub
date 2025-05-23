import * as React from 'react';
import { ModData, ModInfo } from '../home/IModInfo';
import type { ModVersionsRecord } from '@civmods/parser';
import { ActionIcon, Box, LoadingOverlay, Table, Text } from '@mantine/core';
import { IconCircleCheckFilled, IconDownload } from '@tabler/icons-react';
import { DateFormatter } from '../ui/DateFormatter';
import { isSameVersion } from './isSameVersion';
import { ModLocalizedText } from '../localization/ModLocalizedText';
import dayjs from 'dayjs';

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

  const modVersions = mod.fetched.expand?.mod_versions_via_mod_id?.filter(
    (version) => !version.is_variant
  );

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
            <ModVersionRow
              key={version.id}
              version={version}
              mod={mod}
              onInstall={props.onInstall}
            />
          ))}
        </Table.Tbody>
      </Table>
    </Box>
  );
}

function ModVersionRow(props: {
  version: ModVersionsRecord;
  mod: ModData;
  onInstall: (version: ModVersionsRecord) => void;
}) {
  const { version, mod } = props;
  const variants = mod.fetched?.expand?.mod_versions_via_mod_id?.filter(
    (v) => v.is_variant && v.version_parent_id === version.id
  );

  const variantsAndVersion = variants?.length ? [version, ...variants] : [];

  return (
    <>
      <Table.Tr key={version.id}>
        <Table.Td>{version.name}</Table.Td>
        <Table.Td>
          {DateFormatter.format(dayjs(version.released || '').toDate())}
        </Table.Td>
        <Table.Td>
          {version.archive_size ? humanizeSize(version.archive_size) : 'N/A'}
        </Table.Td>
        {variants?.length == 0 && (
          <ModVersionInstallButton
            version={version}
            mod={mod}
            onInstall={props.onInstall}
          />
        )}
      </Table.Tr>
      {variantsAndVersion.map((variant) => (
        <Table.Tr key={variant.id}>
          <Table.Td pl={30} colSpan={3}>
            <Text size="sm" c="dimmed">
              Variant: <ModLocalizedText version={variant} type="name" />
            </Text>
          </Table.Td>
          <Table.Td align="right">
            {isSameVersion(variant, mod.local) ? (
              <ActionIcon color="green">
                <IconCircleCheckFilled size={16} />
              </ActionIcon>
            ) : (
              <ActionIcon
                color={mod.isUnknown ? 'grape' : 'blue'}
                onClick={() => props.onInstall(variant)}
              >
                <IconDownload size={16} />
              </ActionIcon>
            )}
          </Table.Td>
        </Table.Tr>
      ))}
    </>
  );
}

interface ModVersionInstallButtonProps {
  version: ModVersionsRecord;
  mod: ModData;
  onInstall: (version: ModVersionsRecord) => void;
}

function ModVersionInstallButton(props: ModVersionInstallButtonProps) {
  const { version, mod } = props;
  return (
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
  );
}
