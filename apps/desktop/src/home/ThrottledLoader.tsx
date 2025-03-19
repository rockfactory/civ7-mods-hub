import { Loader } from '@mantine/core';
import { useEffect, useState } from 'react';

interface ThrottledLoaderProps {
  loading: boolean;
  delay?: number; // Delay in milliseconds (default: 500ms)
}

const ThrottledLoader: React.FC<ThrottledLoaderProps> = ({
  loading,
  delay = 500,
}) => {
  const [showLoader, setShowLoader] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  useEffect(() => {
    if (loading) {
      // If there's no pending timeout, start showing the loader after delay
      if (!showLoader) {
        const timeout = setTimeout(() => setShowLoader(true), delay);
        setLoadingTimeout(timeout);
      }
    } else {
      // If loading stops, clear any pending timeout and hide the loader
      if (loadingTimeout) clearTimeout(loadingTimeout);
      setShowLoader(false);
    }

    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, [loading]);

  return showLoader ? <Loader size={20} /> : null;
};

export default ThrottledLoader;
