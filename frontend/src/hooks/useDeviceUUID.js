import { useEffect, useState } from 'react';
import { getDeviceUUID } from '../services/supabase';


export const useDeviceUUID = () => {
  const [uuid, setUUID] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchUUID = async () => {
      try {
        const id = await getDeviceUUID();
        if (isMounted) {
          setUUID(id);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to get device UUID', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchUUID();
    return () => { isMounted = false; };
  }, []);

  return { uuid, loading };
};