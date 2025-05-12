import { useAppStore } from '../../store/store';
import { ModData } from '../../home/IModInfo';
import { Menu } from '@mantine/core';
import { IconLock, IconLockOpen2 } from '@tabler/icons-react';
import { useIsModLocked } from './useIsModLocked';

export interface IModLockActionItemProps {
  mod: ModData;
}

export function ModLockActionItem(props: IModLockActionItemProps) {
  const { mod } = props;
  const modinfoIds = mod.modinfoIds;
  if (modinfoIds.length == 0) return;

  const isLocked = useIsModLocked(modinfoIds);

  if (!isLocked) {
    return (
      <Menu.Item
        onClick={() => {
          for (const modinfo_id of modinfoIds) {
            useAppStore.getState().setModLock(modinfo_id);
          }
        }}
        leftSection={<IconLock size={16} />}
      >
        Lock
      </Menu.Item>
    );
  }

  return (
    <Menu.Item
      onClick={() => {
        for (const modinfo_id of modinfoIds) {
          useAppStore.getState().setModLock(modinfo_id, false);
        }
      }}
      leftSection={<IconLockOpen2 size={16} />}
    >
      Unlock
    </Menu.Item>
  );
}
