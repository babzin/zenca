// @ts-ignore
import { useEffect, useState } from 'react';

export const useDeviceUUID = () => {
  const [uuid, setUUID] = useState<string | null>(null);

  useEffect(() => {
    import('../services/supabase').then((supabaseModule) => {
      const getDeviceUUID =
        (supabaseModule as any).getDeviceUUID ??
        (supabaseModule as any).default?.getDeviceUUID;

      if (typeof getDeviceUUID === 'function') {
        getDeviceUUID().then(setUUID).catch(() => setUUID(null));
      }
    });
  }, []);

  return uuid;
};