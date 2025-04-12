import { useEffect, useState } from 'react';
import { invokeIsCiv7Running } from './executableRustBinding';

const REFRESH_INTERVAL = 1000; // 1 seconds

/**
 * Checks every second (REFRESH_INTERVAL) if the executable
 * is running and updates the state accordingly.
 */
export function useExecutableState() {
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsLoading(true);
      invokeIsCiv7Running()
        .then((running) => {
          setIsRunning(running);
        })
        .catch((error) => {
          console.error('Error checking executable state:', error);
          setIsRunning(false); // Set to false if there's an error
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return { isRunning, isLoading };
}
