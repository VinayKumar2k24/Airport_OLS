import { useState, useEffect } from 'react';
import { airportService } from '../services/airportService';

export const useRunways = (selectedIcao: string, onServerError: (msg: string) => void) => {
  const [runways, setRunways] = useState<string[]>([]);
  const [selectedRunway, setSelectedRunway] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedIcao) {
      setRunways([]);
      setSelectedRunway('');
      return;
    }

    const fetchRunways = async () => {
      setLoading(true);
      try {
        const data = await airportService.getRunways(selectedIcao);
        setRunways(data);
        if (data.length > 0) {
          const defaultRw = typeof data[0] === 'string' 
            ? data[0] 
            : (data[0] as any)?.runway || (data[0] as any)?.runway_name || String(data[0]);
          setSelectedRunway(defaultRw);
        } else {
          setSelectedRunway('');
        }
      } catch (err: any) {
        console.error(`Error fetching runways for ${selectedIcao}:`, err);
        onServerError(err.message || `Failed to fetch runways for airport ${selectedIcao}.`);
      } finally {
        setLoading(false);
      }
    };

    fetchRunways();
  }, [selectedIcao]);

  return {
    runways,
    selectedRunway,
    setSelectedRunway,
    loading,
  };
};
