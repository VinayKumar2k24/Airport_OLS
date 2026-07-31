// Helper formatting utilities for GIS coordinates, heights, areas, and dimensions

export const formatMeter = (val: number | undefined | null): string => {
  if (val === undefined || val === null) return '0 m';
  return `${val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} m`;
};

export const formatArea = (val: number | undefined | null): string => {
  if (val === undefined || val === null) return '0 m²';
  return `${val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m²`;
};

export const formatLatLng = (lat: number, lng: number): string => {
  const latStr = lat >= 0 ? `${lat.toFixed(6)}° N` : `${Math.abs(lat).toFixed(6)}° S`;
  const lngStr = lng >= 0 ? `${lng.toFixed(6)}° E` : `${Math.abs(lng).toFixed(6)}° W`;
  return `${latStr}, ${lngStr}`;
};

export const formatHeading = (heading: number | undefined | null): string => {
  if (heading === undefined || heading === null) return '0°';
  return `${heading}°`;
};
