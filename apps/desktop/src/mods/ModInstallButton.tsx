import * as React from 'react';
import { FetchedVersion, ModData } from '../home/IModInfo';
import type { ModVersionsRecord } from '@civmods/parser';
import { Tooltip, ActionIcon } from '@mantine/core';
import {
  IconTransitionBottom,
  IconDownload,
  IconCircleCheckFilled,
  IconAlertHexagon,
} from '@tabler/icons-react';
import { InstallModOptions } from './installMod';

export interface IModInstallButtonProps {
  mod: ModData;
  version: FetchedVersion | undefined | null;
  isTargetLatest?: boolean;
  onInstall: (version: FetchedVersion, options?: InstallModOptions) => void;
}

export function ModInstallButton(props: IModInstallButtonProps) {
  const { mod, version, isTargetLatest } = props;

  // Local-only mods
  if (!mod.fetched) {
    return (
      <Tooltip
        color="dark.8"
        label="This mod is not available in the mod repository, it was installed manually."
      >
        <ActionIcon variant="filled" color="orange">
          <IconAlertHexagon size={16} />
        </ActionIcon>
      </Tooltip>
    );
  }

  if (
    mod.locals.length &&
    mod.installedVersion?.hash_stable === version?.hash_stable
  ) {
    return (
      <Tooltip
        color="dark.8"
        label={
          isTargetLatest
            ? 'Latest version already installed'
            : `${version?.name} already installed`
        }
      >
        <ActionIcon variant="filled" color="green">
          <IconCircleCheckFilled size={16} />
        </ActionIcon>
      </Tooltip>
    );
  }

  if (version == null || version.skip_install || !version.modinfo_id) {
    return (
      <Tooltip
        label="This version is not installable because the Archive file or the Download URL is not supported. Please download and install manually from mod page."
        color="dark.8"
        maw={300}
        multiline
      >
        <ActionIcon color="red" disabled>
          <IconDownload size={16} />
        </ActionIcon>
      </Tooltip>
    );
  }

  if (mod.isUnknown) {
    return (
      <Tooltip
        color="dark.8"
        label={`Install ${
          isTargetLatest ? 'latest' : version.name
        } version, current version unknown`}
      >
        <ActionIcon color="grape" onClick={() => props.onInstall(version)}>
          <IconTransitionBottom size={16} />
        </ActionIcon>
      </Tooltip>
    );
  }

  if (mod.locals.length) {
    if (!mod.installedVersion) {
      console.warn(
        `Mod ${mod.fetched.name} has local data but no installed version`
      );
    }

    return (
      <Tooltip
        color="dark.8"
        label={`Update to ${version.name}, installed ${
          mod.installedVersion?.name ?? 'N/A'
        }`}
      >
        <ActionIcon color="blue" onClick={() => props.onInstall(version)}>
          <IconDownload size={16} />
        </ActionIcon>
      </Tooltip>
    );
  }

  if (mod.installedVersion) {
    console.error(
      `Mod ${mod.fetched.name} has installed version but no local data`
    );
  }

  return (
    <Tooltip
      color="dark.8"
      label={`Install ${isTargetLatest ? 'latest' : version.name}`}
    >
      <ActionIcon
        mt="md"
        variant="light"
        onClick={() => props.onInstall(version!)}
      >
        <IconDownload size={16} />
      </ActionIcon>
    </Tooltip>
  );
}
