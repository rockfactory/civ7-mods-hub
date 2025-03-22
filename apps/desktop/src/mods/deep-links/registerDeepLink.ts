import { onOpenUrl, getCurrent } from '@tauri-apps/plugin-deep-link';
import { emit, listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';

export type DeepLinkType = 'install' | 'profile';

export interface IDeepLinkActivation {
  url: string;
  type: DeepLinkType;
}

const SupportedTypes = {
  'civmods://install': 'install',
  'civmods://profile': 'profile',
} as const;

export const DeepLinkActivations: Record<DeepLinkType, IDeepLinkActivation[]> =
  {
    install: [],
    profile: [],
  };

function addDeepLinkActivation(urls: string[] | null) {
  const url = urls?.[0];
  if (!url) return;

  console.log('[deeplink] Found deep link:', url);
  if (!url.startsWith('civmods://')) {
    return;
  }

  let type: 'install' | 'profile' | undefined;
  for (const prefix in SupportedTypes) {
    if (url.startsWith(prefix)) {
      type = SupportedTypes[prefix as keyof typeof SupportedTypes];
      break;
    }
  }
  if (!type) {
    console.warn('[deeplink] Unsupported deep link:', url);
    return;
  }

  DeepLinkActivations[type].push({ url, type });
  emit('deep-link-activation', { url, type });
}

export async function registerDeepLink() {
  console.log('[v2] Waiting for deep link registration..');
  await getCurrent().then((url) => {
    addDeepLinkActivation(url);
  });

  await onOpenUrl(async (urls) => {
    addDeepLinkActivation(urls);
  });
}

export function useDeepLinkActivation(type: DeepLinkType) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let unlisten: () => void;

    async function init() {
      unlisten = await listen('deep-link-activation', (event) => {
        const payload = event.payload as IDeepLinkActivation;
        if (payload.type === type) {
          setCount((prev) => prev + 1);
        }
      });
    }

    init();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  return count;
}
