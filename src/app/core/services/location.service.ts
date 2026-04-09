import { Injectable } from '@angular/core';
import { LocationData } from '../types/panchang.types';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly locations: LocationData[] = [
    { name: 'Delhi', latitude: 28.6139, longitude: 77.2090, continent: 'Asia', country: 'India', state: 'Delhi' },
    { name: 'Mumbai', latitude: 19.0760, longitude: 72.8777, continent: 'Asia', country: 'India', state: 'Maharashtra' },
    { name: 'Bangalore', latitude: 12.9716, longitude: 77.5946, continent: 'Asia', country: 'India', state: 'Karnataka' },
    { name: 'Kolkata', latitude: 22.5726, longitude: 88.3639, continent: 'Asia', country: 'India', state: 'West Bengal' },
    { name: 'Chennai', latitude: 13.0827, longitude: 80.2707, continent: 'Asia', country: 'India', state: 'Tamil Nadu' },
    { name: 'New York', latitude: 40.7128, longitude: -74.0060, continent: 'North America', country: 'United States', state: 'New York' },
    { name: 'London', latitude: 51.5074, longitude: -0.1278, continent: 'Europe', country: 'United Kingdom', state: 'England' },
    { name: 'Singapore', latitude: 1.3521, longitude: 103.8198, continent: 'Asia', country: 'Singapore', state: 'Singapore' }
  ];

  getLocations(): LocationData[] {
    return [...this.locations];
  }

  getLocationByName(name: string): LocationData | undefined {
    return this.locations.find(location => location.name === name);
  }

  getDefaultLocation(): LocationData {
    return this.locations[0]; // Delhi as default
  }
}