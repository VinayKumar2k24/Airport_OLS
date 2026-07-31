import { api, fetchStaticFile } from './api';
import { AnalysisRequest, AnalysisResponse, EncroachmentSummaryRow } from '../types/analysis';
import Papa from 'papaparse';

export const analysisService = {
  runAnalysis: async (airportIcao: string, runwayName: string): Promise<AnalysisResponse> => {
    const payload: AnalysisRequest = {
      airport_icao: airportIcao,
      runway_name: runwayName,
    };
    const response = await api.post<AnalysisResponse>('/analyze', payload);
    return response.data;
  },

  fetchComplianceReport: async (airportIcao: string): Promise<string> => {
    const filePath = `processed_${airportIcao}/${airportIcao}_compliance_report.txt`;
    return await fetchStaticFile(filePath);
  },

  fetchEncroachmentSummary: async (airportIcao: string): Promise<EncroachmentSummaryRow[]> => {
    const filePath = `processed_${airportIcao}/${airportIcao}_encroachment_summary.csv`;
    const csvContent = await fetchStaticFile(filePath);

    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data.map((row: any) => ({
            building_id: row.building_id || row.id || 'N/A',
            zone_name: row.zone_name || row.zone || 'N/A',
            allowed_height: Number(row.allowed_height) || 0,
            detected_height: Number(row.detected_height) || 0,
            height_difference: Number(row.height_difference) || 0,
            risk_level: row.risk_level || 'Low',
            latitude: Number(row.latitude) || 0,
            longitude: Number(row.longitude) || 0,
            area_sqm: Number(row.area_sqm || row.area) || 0,
          }));
          resolve(rows);
        },
        error: (error: any) => {
          reject(error);
        },
      });
    });
  },
};
