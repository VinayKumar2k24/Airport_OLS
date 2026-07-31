import { useState, useCallback } from 'react';
import { analysisService } from '../services/analysisService';
import { geojsonService } from '../services/geojsonService';
import { EncroachmentSummaryRow, AnalyticsSummary, SystemLog } from '../types/analysis';
import { OLSFeatureCollection, EncroachmentFeatureCollection } from '../types/geojson';
import { AirportMetadata } from '../types/airport';

export const useAnalysis = (
  onSuccess: (msg: string) => void,
  onError: (msg: string) => void
) => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  
  // Data files loaded after analysis
  const [olsGeoJson, setOlsGeoJson] = useState<OLSFeatureCollection | null>(null);
  const [encroachmentsGeoJson, setEncroachmentsGeoJson] = useState<EncroachmentFeatureCollection | null>(null);
  const [csvData, setCsvData] = useState<EncroachmentSummaryRow[]>([]);
  const [complianceReport, setComplianceReport] = useState<string>('');
  
  // Summary dashboard cards metrics
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  const addLog = useCallback((message: string, level: SystemLog['level'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, level, message }]);
  }, []);

  const runOlsAnalysis = async (
    icao: string, 
    runwayName: string, 
    airportInfo: AirportMetadata | null
  ) => {
    if (!icao || !runwayName) {
      onError('Please select both an airport and a runway.');
      return;
    }

    setIsAnalyzing(true);
    setLogs([]);
    addLog(`Initiating OLS Obstacle Encroachment Analysis for Airport ${icao}, Runway ${runwayName}...`, 'info');

    try {
      // 1. Trigger backend POST /analyze
      addLog(`Sending analysis request to backend (POST /analyze)...`, 'info');
      const response = await analysisService.runAnalysis(icao, runwayName);
      addLog(`Backend Response: ${response.message}`, 'success');

      // 2. Fetch OLS Surfaces GeoJSON
      addLog(`Fetching OLS surfaces GeoJSON for ${icao}...`, 'info');
      const olsData = await geojsonService.fetchOLSSurfaces(icao);
      setOlsGeoJson(olsData);
      addLog(`OLS surfaces GeoJSON successfully loaded.`, 'success');

      // 3. Fetch Encroachment Analytics GeoJSON
      addLog(`Fetching encroachment analytics GeoJSON for ${icao}...`, 'info');
      const encroachData = await geojsonService.fetchEncroachments(icao);
      setEncroachmentsGeoJson(encroachData);
      addLog(`Encroachments GeoJSON successfully loaded.`, 'success');

      // 4. Fetch CSV Summary
      addLog(`Fetching encroachment CSV summary report for ${icao}...`, 'info');
      const parsedCsv = await analysisService.fetchEncroachmentSummary(icao);
      setCsvData(parsedCsv);
      addLog(`Encroachment CSV loaded and parsed successfully. Found ${parsedCsv.length} records.`, 'success');

      // 5. Fetch Compliance Report TXT
      addLog(`Fetching compliance report for ${icao}...`, 'info');
      const reportTxt = await analysisService.fetchComplianceReport(icao);
      setComplianceReport(reportTxt);
      addLog(`Compliance report text loaded successfully.`, 'success');

      // 6. Compute metrics
      addLog(`Compiling dashboard metrics...`, 'info');
      const criticalCount = parsedCsv.filter((r) => r.risk_level === 'Critical').length;
      const highCount = parsedCsv.filter((r) => r.risk_level === 'High').length;
      const mediumCount = parsedCsv.filter((r) => r.risk_level === 'Medium').length;
      const lowCount = parsedCsv.filter((r) => r.risk_level === 'Low').length;
      const maxHeight = parsedCsv.length > 0 ? Math.max(...parsedCsv.map((r) => r.detected_height)) : 0;
      const avgArea = parsedCsv.length > 0 
        ? parsedCsv.reduce((acc, curr) => acc + (curr.area_sqm || 0), 0) / parsedCsv.length 
        : 0;

      const rName = Object.keys(airportInfo?.runways || {}).find(
        (key) => key.toLowerCase() === runwayName.toLowerCase() || key === runwayName
      ) || runwayName;
      const runwayMeta = airportInfo?.runways[rName];

      setSummary({
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        detectedStructuresCount: parsedCsv.length,
        maxHeight,
        avgArea,
        airportElevation: airportInfo?.elevation || 0,
        runwayLength: runwayMeta?.length || 0,
        runwayWidth: runwayMeta?.width || 0,
      });

      addLog(`Dashboard metrics successfully updated. OLS Monitoring active.`, 'success');
      onSuccess(`OLS Analysis completed for airport ${icao}!`);

    } catch (err: any) {
      console.error('OLS Analysis error:', err);
      const errMsg = err.response?.data?.message || err.message || 'An error occurred during analysis.';
      addLog(`Analysis Failed: ${errMsg}`, 'error');
      onError(`Analysis Failed: ${errMsg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setOlsGeoJson(null);
    setEncroachmentsGeoJson(null);
    setCsvData([]);
    setComplianceReport('');
    setSummary(null);
    setLogs([]);
    onSuccess('Dashboard has been reset.');
  };

  return {
    isAnalyzing,
    logs,
    olsGeoJson,
    encroachmentsGeoJson,
    csvData,
    complianceReport,
    summary,
    runOlsAnalysis,
    resetAnalysis,
    addLog,
  };
};
