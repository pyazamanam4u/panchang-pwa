import { PanchangWithFormData } from './panchang.types';

export type SankalpamLanguage = 'en-IN' | 'hi-IN' | 'te-IN' | 'kn-IN' | 'ta-IN' | 'sa-IN';

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface UserDetails {
  fullName: string;
  gotra: string;
  gender: 'Male' | 'Female' | 'Other';
  nakshatra?: string;
  date: string;
  locationName: string;
  latitude: number;
  longitude: number;
  intention: string;
}

export interface PanchangApiRequest {
  date: string;
  latitude: number;
  longitude: number;
}

export interface PanchangApiResponse {
  tithi: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  masa: string;
  ayana: string;
  ritu: string;
  samvatsara: string;
}

export interface SankalpamRequest {
  userDetails: UserDetails;
  panchangam: PanchangApiResponse | PanchangWithFormData;
  language: SankalpamLanguage;
}

export interface SankalpamResponse {
  sankalpaTemplate: string;
  audioUrl: string;
}

export interface SankalpamResult {
  sankalpaTemplate: string;
  audioUrl: string;
  generatedAt: string;
}
