import * as React from 'react';
import { useAppStore } from '../../store/store';
import { ModData } from '../../home/IModInfo';
import { Menu } from '@mantine/core';
import {
  IconLock,
  IconLockAccess,
  IconLockAccessOff,
  IconLockOpen,
  IconLockOpen2,
} from '@tabler/icons-react';

export interface IModLockActionItemProps {
  mod: ModData;
}

export function ModLockActionItem(props: IModLockActionItemProps) {
  const modinfo_id = props.mod.local?.modinfo_id;
  if (!modinfo_id) return;

  const isLocked = useAppStore((state) =>
    state.lockedModIds?.includes(modinfo_id)
  );

  if (!isLocked) {
    return (
      <Menu.Item
        onClick={() => {
          useAppStore.getState().setModLock(modinfo_id);
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
        useAppStore.getState().setModLock(modinfo_id, false);
      }}
      leftSection={<IconLockOpen2 size={16} />}
    >
      Unlock
    </Menu.Item>
  );
}
