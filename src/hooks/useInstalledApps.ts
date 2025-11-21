import { useState, useEffect, useCallback } from 'react';
import InstalledApps from '../plugins/installedApps';
import { AppData } from '../../types';

export const useInstalledApps = () => {
  const [apps, setApps] = useState<AppData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchApps = useCallback(async () => {
    try {
      setLoading(true);
      // In a web environment (not android), this will fail or do nothing if not mocked.
      // We assume this runs in Capacitor Android context.
      const result = await InstalledApps.getApps();
      
      // Sort apps alphabetically
      const sortedApps = result.apps.sort((a, b) => 
        a.label.localeCompare(b.label)
      );
      
      setApps(sortedApps);
    } catch (err) {
      console.error("Failed to fetch apps", err);
      setError("Could not load installed applications.");
      
      // Fallback for development in browser (Mock Data)
      if (process.env.NODE_ENV === 'development' && !(window as any).androidBridge) {
         const mockApps: AppData[] = Array.from({ length: 20 }).map((_, i) => ({
             label: `App ${i + 1}`,
             packageName: `com.example.app${i}`,
             icon: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==` // 1x1 transparent pixel
         }));
         setApps(mockApps);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const launchApp = useCallback(async (packageName: string) => {
    try {
      await InstalledApps.launchApp({ packageName });
    } catch (err) {
      console.error("Failed to launch app", err);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const filteredApps = apps.filter(app => 
    app.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    apps: filteredApps,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    launchApp,
    refresh: fetchApps
  };
};