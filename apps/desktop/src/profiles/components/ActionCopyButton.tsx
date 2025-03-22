import { CopyButton, Tooltip, ActionIcon } from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import * as React from 'react';

export interface IActionCopyButtonProps {
  value: string;
  title: string;
}

export function ActionCopyButton(props: IActionCopyButtonProps) {
  return (
    <CopyButton value={props.value} timeout={2000}>
      {({ copied, copy }) => (
        <Tooltip
          label={copied ? 'Copied' : props.title}
          withArrow
          position="right"
        >
          <ActionIcon
            color={copied ? 'teal' : 'blue'}
            variant="light"
            size="input-sm"
            onClick={copy}
          >
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
  );
}
