import { useState, useEffect } from 'react';
import { airportService } from '../services/airportService';
import { AirportMetadata, AIRPORT_METADATA_LOOKUP } from '../types/airport';

export const useAirports = (onServerError: (msg: string) => void) => {
  const [airports, setAirports] = useState<string[]>([]);
  const [selectedIcao, setSelectedIcao] = useState<string>('');
  const [selectedAirportInfo, setSelectedAirportInfo] = useState<AirportMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchAirports = async () => {
      setLoading(true);
      try {
        const data = await airportService.getAirports();
        setAirports(data);
        if (data.length > 0) {
          // Select VABB default if exists, else first one
          const defaultIcao = data.includes('VABB') ? 'VABB' : data[0];
          handleSelectAirport(defaultIcao);
        }
      } catch (err: any) {
        console.error('Error fetching airports:', err);
        onServerError(err.message || 'Failed to fetch airports from backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchAirports();
  }, []);

  const handleSelectAirport = (icaoInput: any) => {
    const icao = typeof icaoInput === 'string' 
      ? icaoInput 
      : icaoInput?.ICAO || icaoInput?.icao || String(icaoInput || '');
      
    setSelectedIcao(icao);
    const meta = AIRPORT_METADATA_LOOKUP[icao] || null;
    setSelectedAirportInfo(meta);
  };

  return {
    airports,
    selectedIcao,
    selectedAirportInfo,
    loading,
    selectAirport: handleSelectAirport,
  };
};
