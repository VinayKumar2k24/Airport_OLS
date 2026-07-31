// Color utilities for mapping OLS elements and risk levels to HEX/RGB/RGBA

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export const RISK_COLORS_HEX: Record<RiskLevel, string> = {
  Critical: '#FF4D4D', // Red
  High: '#FF9900',     // Orange
  Medium: '#FFD700',   // Yellow
  Low: '#00E676',      // Green
};

export const RISK_COLORS_RGB: Record<RiskLevel, [number, number, number]> = {
  Critical: [255, 77, 77],
  High: [255, 153, 0],
  Medium: [255, 215, 0],
  Low: [0, 230, 118],
};

export const RISK_COLORS_RGBA = (level: RiskLevel, alpha = 180): [number, number, number, number] => {
  const rgb = RISK_COLORS_RGB[level] || [128, 128, 128];
  return [...rgb, alpha];
};

export const OLS_SURFACE_COLORS: Record<string, [number, number, number, number]> = {
  'Inner Horizontal Surface': [30, 144, 255, 50],
  'Conical Surface': [30, 144, 255, 70],
  'Approach Surface': [30, 144, 255, 90],
  'Take-off Climb Surface': [30, 144, 255, 90],
  'Takeoff Surface': [30, 144, 255, 90],
  'Transitional Surface': [30, 144, 255, 110],
  default: [30, 144, 255, 60] // Transparent Blue
};

export const getOLSSurfaceColor = (surfaceName: string): [number, number, number, number] => {
  if (!surfaceName) return OLS_SURFACE_COLORS.default;
  
  // Fuzzy match
  const match = Object.keys(OLS_SURFACE_COLORS).find(
    (key) => surfaceName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(surfaceName.toLowerCase())
  );
  
  return match ? OLS_SURFACE_COLORS[match] : OLS_SURFACE_COLORS.default;
};

export const RUNWAY_COLOR_RGBA: [number, number, number, number] = [255, 255, 255, 255]; // White
export const BUILDING_COLOR_RGBA: [number, number, number, number] = [150, 150, 150, 160]; // Gray
export const SELECTED_OUTLINE_RGBA: [number, number, number, number] = [0, 255, 255, 255]; // Cyan
