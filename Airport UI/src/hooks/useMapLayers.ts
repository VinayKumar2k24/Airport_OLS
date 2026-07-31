import { useState } from 'react';

export interface MapLayerState {
  satellite: boolean;
  runway: boolean;
  olsSurface: boolean;
  innerHorizontal: boolean;
  conical: boolean;
  approach: boolean;
  takeoff: boolean;
  transitional: boolean;
  buildings: boolean;
  encroachments: boolean;
  labels: boolean;
}

const DEFAULT_LAYERS: MapLayerState = {
  satellite: true,
  runway: true,
  olsSurface: true,
  innerHorizontal: true,
  conical: true,
  approach: true,
  takeoff: true,
  transitional: true,
  buildings: true,
  encroachments: true,
  labels: true,
};

export const useMapLayers = () => {
  const [layers, setLayers] = useState<MapLayerState>(DEFAULT_LAYERS);

  const toggleLayer = (layerKey: keyof MapLayerState) => {
    setLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  };

  const resetLayers = () => {
    setLayers(DEFAULT_LAYERS);
  };

  return {
    layers,
    toggleLayer,
    resetLayers,
  };
};
