export interface AnalysisRequest {
  airport_icao: string;
  runway_name: string;
}

export interface AnalysisResponse {
  status: string;
  message: string;
  airport: string;
  runway: string;
}

export interface EncroachmentSummaryRow {
  building_id: string;
  zone_name: string;
  allowed_height: number;
  detected_height: number;
  height_difference: number;
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low';
  latitude: number;
  longitude: number;
  area_sqm?: number;
}

export interface AnalyticsSummary {
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  detectedStructuresCount: number;
  maxHeight: number;       // Max detected building height
  avgArea: number;         // Average area (sqm) of buildings
  airportElevation: number;
  runwayLength: number;
  runwayWidth: number;
}

export interface SystemLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
}
