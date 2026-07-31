import { fetchStaticJSON } from './api';
import { OLSFeatureCollection, EncroachmentFeatureCollection } from '../types/geojson';

export const geojsonService = {
  fetchOLSSurfaces: async (airportIcao: string): Promise<OLSFeatureCollection> => {
    const filePath = `processed_${airportIcao}/${airportIcao}_OLS_surfaces.geojson`;
    return await fetchStaticJSON<OLSFeatureCollection>(filePath);
  },

  fetchEncroachments: async (airportIcao: string): Promise<EncroachmentFeatureCollection> => {
    const filePath = `processed_${airportIcao}/${airportIcao}_encroachment_analytics.geojson`;
    return await fetchStaticJSON<EncroachmentFeatureCollection>(filePath);
  },
};
