import { useEffect, useState } from 'react';
import {
  GameInstallation,
  invokeFindCiv7Installation,
} from './executableRustBinding';

/**
 * Checks for the Civ7 installation using the Rust binding.
 */
// TODO Save this in appStore and make it editable
export function useExecutableInstallation() {
  const [installation, setInstallation] = useState<GameInstallation | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstallation = async () => {
      setLoading(true);
      try {
        const result = await invokeFindCiv7Installation();
        setInstallation(result);
      } catch (error) {
        console.error('Error fetching installation:', error);
        setInstallation(null); // Set to null if there's an error
      } finally {
        setLoading(false);
      }
    };

    fetchInstallation();
  }, []);

  return { installation, loading };
}
