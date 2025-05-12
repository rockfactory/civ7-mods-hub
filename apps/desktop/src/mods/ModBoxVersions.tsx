import { FetchedModule, FetchedVersion, ModData } from '../home/IModInfo';
import { ActionIcon, Box, LoadingOverlay, Table, Text } from '@mantine/core';
import { IconCircleCheckFilled, IconDownload } from '@tabler/icons-react';
import { DateFormatter } from '../ui/DateFormatter';
import { isSameVersion } from './isSameVersion';
import { ModLocalizedText } from '../localization/ModLocalizedText';
import { InstallModOptions } from './installMod';

export interface IModBoxVersionsProps {
  mod: ModData;
  onInstall: (version: FetchedVersion, options?: InstallModOptions) => void;
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

  const modVersions = mod.fetched.versions;

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
  version: FetchedVersion;
  mod: ModData;
  onInstall: (version: FetchedVersion, options?: InstallModOptions) => void;
}) {
  const { version, mod } = props;

  // We do not want to display multiple modules if the version
  // has only _one_ module.
  const modules = version.hasMultipleModules ? version.modules : [];

  return (
    <>
      <Table.Tr key={version.id}>
        <Table.Td>{version.name}</Table.Td>
        <Table.Td>
          {/* TODO use dayjs atleast for parsing */}
          {DateFormatter.format(new Date(version.released || ''))}
        </Table.Td>
        <Table.Td>
          {version.archive_size ? humanizeSize(version.archive_size) : 'N/A'}
        </Table.Td>
        <ModVersionInstallButton
          mod={mod}
          version={version}
          onInstall={props.onInstall}
        />
      </Table.Tr>
      {modules.map((module) => (
        <Table.Tr key={module.id}>
          <Table.Td pl={30} colSpan={3}>
            <Text size="sm" c="dimmed">
              Module: <ModLocalizedText version={module} type="name" />
            </Text>
          </Table.Td>
          <ModVersionInstallButton
            mod={mod}
            version={version}
            module={module}
            onInstall={props.onInstall}
          />
        </Table.Tr>
      ))}
    </>
  );
}

interface ModVersionInstallButtonProps {
  mod: ModData;
  version: FetchedVersion;
  module?: FetchedModule;
  onInstall: (version: FetchedVersion, options?: InstallModOptions) => void;
}

function ModVersionInstallButton(props: ModVersionInstallButtonProps) {
  const { version, mod, module } = props;
  return (
    <Table.Td align="right">
      {mod.locals.some((local) => local.version === version) ? (
        <ActionIcon color="green">
          <IconCircleCheckFilled size={16} />
        </ActionIcon>
      ) : (
        <ActionIcon
          color={mod.isUnknown ? 'grape' : 'blue'}
          onClick={() =>
            props.onInstall(version, {
              modules: module ? [module] : undefined,
            })
          }
        >
          <IconDownload size={16} />
        </ActionIcon>
      )}
    </Table.Td>
  );
}
