// Panchang Types
export interface PanchangTimeRange {
  start: string | Date | null;
  end: string | Date | null;
}

export interface PanchangIndexItem {
  index: number;
  name: string;
  completionPercentage: number;
  startTime: string;
  endTime: string;
  isActiveAtSunrise: boolean;
}

export interface PanchangTithi extends PanchangIndexItem {
  paksha: 'Shukla' | 'Krishna';
  number: number;
}

export interface PanchangNakshatra extends PanchangIndexItem {
  pada: number;
  degreesInNakshatra: number;
}

export interface PanchangKarana extends PanchangIndexItem {
  type: string;
}

export interface PanchangLocation {
  latitude: number;
  longitude: number;
}

export interface PanchangMasa {
  index: number;
  name: string;
}

export interface PanchangChandramasa {
  index: number;
  name: string;
  isAdhika: boolean;
  system: string;
  amantaIndex: number;
  amantaName: string;
  purnimantaIndex: number;
  purnimantaName: string;
}

export interface PanchangSamvat {
  vikramSamvat: number;
  shakaSamvat: number;
}

export interface PanchangRashi {
  index: number;
  name: string;
}

export interface PanchangResponse {
  date: string | Date;
  location: PanchangLocation;
  timezone: number;
  sunrise: string | Date;
  sunset: string | Date;
  nextSunrise?: string | Date;
  dayDurationMinutes?: number;
  nightDurationMinutes?: number;
  tithis?: PanchangTithi[];
  nakshatras?: PanchangNakshatra[];
  yogas?: PanchangIndexItem[];
  karanas?: PanchangKarana[];
  vara?: {
    index: number;
    name: string;
    shortName: string;
    englishName: string;
  };
  rahuKalam?: PanchangTimeRange | null;
  gulikaKalam?: PanchangTimeRange | null;
  yamaganda?: PanchangTimeRange | null;
  abhijitMuhurta?: PanchangTimeRange | null;
  moonrise?: string | Date;
  moonset?: string | Date;
  moonPhase?: string;
  masa?: PanchangMasa;
  chandramasa?: PanchangChandramasa;
  samvat?: PanchangSamvat;
  chandraRashi?: PanchangRashi;
  suryaNakshatra?: PanchangRashi;
  brahmaMuhurta?: PanchangTimeRange | null;
}

// Form Data Interface
export interface FormData {
  name: string;
  gotra: string;
  deity: string;
  goal: string;
  date: string;
  location: string; // Location name
}

// Location Interface
export interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
  continent: string;
  country: string;
  state: string;
}

// Combined Response with Form Data
export interface PanchangWithFormData extends PanchangResponse {
  userData: FormData;
  locationData: LocationData;
}

// Audio Cache Key
export interface AudioCacheKey {
  name: string;
  gotra: string;
  deity: string;
  goal: string;
  date: string;
  location: string;
  tithi: string;
  nakshatra: string;
  yoga: string;
  karana: string;
}