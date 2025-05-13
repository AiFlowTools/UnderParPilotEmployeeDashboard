// src/lib/geolocation.ts

export interface GeolocationResult {
  latitude: number;
  longitude: number;
}

export class GeolocationError extends Error {
  code: number;
  
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
    this.name = 'GeolocationError';
  }

  static get PERMISSION_DENIED() { return 1; }
  static get POSITION_UNAVAILABLE() { return 2; }
  static get TIMEOUT() { return 3; }
}

export async function requestGeolocation(): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new GeolocationError('Geolocation is not supported', GeolocationError.POSITION_UNAVAILABLE));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        let message = 'Failed to get location';
        let code = GeolocationError.POSITION_UNAVAILABLE;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied';
            code = GeolocationError.PERMISSION_DENIED;
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            code = GeolocationError.POSITION_UNAVAILABLE;
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            code = GeolocationError.TIMEOUT;
            break;
        }
        
        reject(new GeolocationError(message, code));
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
}