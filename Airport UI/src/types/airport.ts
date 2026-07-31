export interface RunwayInfo {
  name: string;
  width: number;       // meters
  length: number;      // meters
  heading: number;     // degrees
}

export interface AirportMetadata {
  icao: string;
  name: string;
  elevation: number;    // meters
  crs: string;         // Coordinate Reference System
  utmZone: string;     // UTM Zone e.g. "43N"
  latitude: number;    // Center lat for maps
  longitude: number;   // Center lng for maps
  zoom: number;        // Default map zoom
  runways: Record<string, RunwayInfo>;
}

// Static lookup details for supported airports
export const AIRPORT_METADATA_LOOKUP: Record<string, AirportMetadata> = {
  VABB: {
    icao: 'VABB',
    name: 'Chhatrapati Shivaji Maharaj International Airport (Mumbai)',
    elevation: 11,
    crs: 'WGS 84 / UTM Zone 43N',
    utmZone: '43N',
    latitude: 19.0896,
    longitude: 72.8656,
    zoom: 14,
    runways: {
      'Sep-27': { name: '09/27', width: 45, length: 3448, heading: 90 },
      '14-32': { name: '14/32', width: 45, length: 2925, heading: 140 }
    }
  },
  VIDP: {
    icao: 'VIDP',
    name: 'Indira Gandhi International Airport (Delhi)',
    elevation: 237,
    crs: 'WGS 84 / UTM Zone 43N',
    utmZone: '43N',
    latitude: 28.5562,
    longitude: 77.1000,
    zoom: 13,
    runways: {
      '09-27': { name: '09/27', width: 45, length: 2813, heading: 90 },
      '11-29': { name: '11/29', width: 60, length: 4430, heading: 110 },
      '10-28': { name: '10/28', width: 46, length: 3810, heading: 100 }
    }
  },
  VOBL: {
    icao: 'VOBL',
    name: 'Kempegowda International Airport (Bengaluru)',
    elevation: 915,
    crs: 'WGS 84 / UTM Zone 43N',
    utmZone: '43N',
    latitude: 13.1986,
    longitude: 77.7066,
    zoom: 13,
    runways: {
      '09L-27R': { name: '09L/27R', width: 60, length: 4000, heading: 90 },
      '09R-27L': { name: '09R/27L', width: 45, length: 4000, heading: 90 }
    }
  },
  VECC: {
    icao: 'VECC',
    name: 'Netaji Subhash Chandra Bose International Airport (Kolkata)',
    elevation: 5,
    crs: 'WGS 84 / UTM Zone 45N',
    utmZone: '45N',
    latitude: 22.6547,
    longitude: 88.4467,
    zoom: 13,
    runways: {
      '01R-19L': { name: '01R/19L', width: 46, length: 3627, heading: 10 },
      '01L-19R': { name: '01L/19R', width: 46, length: 2839, heading: 10 }
    }
  },
  VOHS: {
    icao: 'VOHS',
    name: 'Rajiv Gandhi International Airport (Hyderabad)',
    elevation: 617,
    crs: 'WGS 84 / UTM Zone 44N',
    utmZone: '44N',
    latitude: 17.2405,
    longitude: 78.4294,
    zoom: 13,
    runways: {
      '09R-27L': { name: '09R/27L', width: 60, length: 4260, heading: 90 },
      '09L-27R': { name: '09L/27R', width: 45, length: 3707, heading: 90 }
    }
  },
  KJFK: {
    icao: 'KJFK',
    name: 'John F. Kennedy International Airport (New York)',
    elevation: 4,
    crs: 'WGS 84 / UTM Zone 18T',
    utmZone: '18T',
    latitude: 40.6398,
    longitude: -73.7789,
    zoom: 12,
    runways: {
      '13L-31R': { name: '13L/31R', width: 45, length: 3048, heading: 130 },
      '04L-22R': { name: '04L/22R', width: 45, length: 3682, heading: 40 },
      '04R-22L': { name: '04R/22L', width: 45, length: 2560, heading: 40 },
      '13R-31L': { name: '13R/31L', width: 45, length: 4423, heading: 130 }
    }
  },
  KORD: {
    icao: 'KORD',
    name: 'O\'Hare International Airport (Chicago)',
    elevation: 204,
    crs: 'WGS 84 / UTM Zone 16T',
    utmZone: '16T',
    latitude: 41.9742,
    longitude: -87.9073,
    zoom: 12,
    runways: {
      '10L-28R': { name: '10L/28R', width: 45, length: 3962, heading: 100 },
      '09C-27C': { name: '09C/27C', width: 45, length: 3261, heading: 90 },
      '09R-27L': { name: '09R/27L', width: 45, length: 2286, heading: 90 },
      '10C-28C': { name: '10C/28C', width: 45, length: 3292, heading: 100 },
      '10R-28L': { name: '10R/28L', width: 45, length: 2286, heading: 100 }
    }
  }
};
