import { FeatureCollection, Feature, Geometry } from 'geojson';

export interface OLSProperties {
  surface_name?: string;
  zone_name?: string;
  elevation?: number;
  slope?: number;
  color?: string;
  [key: string]: unknown;
}

export interface EncroachmentProperties {
  building_id: string;
  zone_name: string;
  allowed_height: number;
  detected_height: number;
  height_difference: number;
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low';
  latitude: number;
  longitude: number;
  area?: number;
  [key: string]: unknown;
}

export type OLSFeatureCollection = FeatureCollection<Geometry, OLSProperties>;
export type EncroachmentFeatureCollection = FeatureCollection<Geometry, EncroachmentProperties>;

export type OLSFeature = Feature<Geometry, OLSProperties>;
export type EncroachmentFeature = Feature<Geometry, EncroachmentProperties>;
