import React, { createContext, useContext, useState, useCallback } from "react";

const AppContext = createContext(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("ols_user") || "null"); } catch { return null; }
  });
  const [airports, setAirports] = useState([]);
  const [selectedIcao, setSelectedIcao] = useState("");
  const [airportName, setAirportName] = useState("");
  const [runways, setRunways] = useState([]);
  const [selectedRunway, setSelectedRunway] = useState("");
  const [baselineFrom, setBaselineFrom] = useState("2020-01-01");
  const [baselineTo, setBaselineTo] = useState("2020-12-31");
  const [monitoringFrom, setMonitoringFrom] = useState("2023-01-01");
  const [monitoringTo, setMonitoringTo] = useState("2023-12-31");
  const [olsGeoJson, setOlsGeoJson] = useState(null);
  const [encroachmentsGeoJson, setEncroachmentsGeoJson] = useState(null);
  const [stats, setStats] = useState(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [layers, setLayers] = useState({ olsSurfaces:true, encroachments:true, labels:true, satelliteView:true, terrainView:false, heatmap:false });
  const [olsOpacity, setOlsOpacity] = useState(0.08);

  const login = useCallback((userData) => {
    setUser(userData);
    sessionStorage.setItem("ols_user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem("ols_user");
    setOlsGeoJson(null); setEncroachmentsGeoJson(null); setStats(null); setAnalysisComplete(false);
  }, []);

  const toggleLayer = useCallback((key) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const clearAnalysis = useCallback(() => {
    setOlsGeoJson(null); setEncroachmentsGeoJson(null); setStats(null); setAnalysisComplete(false);
  }, []);

  const value = {
    user, login, logout,
    airports, setAirports,
    selectedIcao, setSelectedIcao,
    airportName, setAirportName,
    runways, setRunways,
    selectedRunway, setSelectedRunway,
    baselineFrom, setBaselineFrom,
    baselineTo, setBaselineTo,
    monitoringFrom, setMonitoringFrom,
    monitoringTo, setMonitoringTo,
    olsGeoJson, setOlsGeoJson,
    encroachmentsGeoJson, setEncroachmentsGeoJson,
    stats, setStats,
    analysisComplete, setAnalysisComplete,
    clearAnalysis,
    layers, toggleLayer,
    olsOpacity, setOlsOpacity,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
