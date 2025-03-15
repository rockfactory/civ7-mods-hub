import { onOpenUrl, getCurrent } from '@tauri-apps/plugin-deep-link';
import { emit, listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';

export interface IDeepLinkActivation {
  url: string;
}

export const DeepLinkActivations: IDeepLinkActivation[] = [];

export async function registerDeepLink() {
  console.log('[v2] Waiting for deep link registration..');
  await getCurrent().then((url) => {
    if (url?.[0]) {
      console.log('[v2] Current deep link:', url);
      DeepLinkActivations.push({ url: url[0] });
      emit('deep-link-activation');
    }
  });

  await onOpenUrl(async (urls) => {
    const url = urls[0];
    console.log('[deeplink] Found deep link:', url);
    if (!url.startsWith('civmods://')) {
      return;
    }

    DeepLinkActivations.push({ url });
    emit('deep-link-activation');
  });
}

export function useDeepLinkActivation() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let unlisten: () => void;

    async function init() {
      unlisten = await listen('deep-link-activation', () => {
        setCount((c) => c + 1);
      });
    }

    init();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  return count;
}
