import { Button, Progress, Stack, Text } from '@mantine/core';
import * as React from 'react';
import { useState } from 'react';

export interface IImportProfileModalLoadingContentProps {
  cancelImport: () => void;
  isCanceling: boolean;
  text: React.ReactNode;
  value: number;
}

export function ImportProfileModalLoadingContent(
  props: IImportProfileModalLoadingContentProps
) {
  const { cancelImport, isCanceling, text, value } = props;

  const [isLocalCanceling, setIsLocalCanceling] = useState(false);

  return (
    <Stack gap="xs" align="center">
      <Progress value={value} animated w="100%" />
      <Text size="sm">{text}</Text>
      <Button
        onClick={() => {
          setIsLocalCanceling(true);
          cancelImport();
        }}
        color="red"
        disabled={isCanceling || isLocalCanceling}
        loading={isCanceling}
      >
        Cancel
      </Button>
    </Stack>
  );
}
