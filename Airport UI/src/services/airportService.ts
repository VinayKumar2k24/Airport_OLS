import { api } from './api';

export const airportService = {
  getAirports: async (): Promise<string[]> => {
    const response = await api.get<any>('/airports');
    const data = response.data;
    if (Array.isArray(data)) {
      return data.map((item: any) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          return (
            item.ICAO ||
            item.icao ||
            item.Airport ||
            item.airport ||
            item.name ||
            Object.values(item)[0] ||
            String(item)
          );
        }
        return String(item);
      });
    }
    return [];
  },

  getRunways: async (airportIcao: string): Promise<string[]> => {
    const icaoStr = typeof airportIcao === 'string' ? airportIcao : String(airportIcao);
    const response = await api.get<any>(`/runways/${icaoStr}`);
    const data = response.data;
    if (Array.isArray(data)) {
      return data.map((item: any) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          return (
            item.runway ||
            item.runway_name ||
            item.name ||
            Object.values(item)[0] ||
            String(item)
          );
        }
        return String(item);
      });
    }
    return [];
  },
};
