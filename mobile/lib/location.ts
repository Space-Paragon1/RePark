import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

export type CurrentLocation =
  | { status: 'idle' | 'locating' | 'denied' | 'error' }
  | { status: 'ready'; latitude: number; longitude: number; accuracy: number | null; place: string | null };

/** "142 Elm Street", or the nearest name the system has. */
function describePlace(a: Location.LocationGeocodedAddress | undefined): string | null {
  if (!a) return null;
  if (a.street) return [a.streetNumber, a.street].filter(Boolean).join(' ');
  return a.name ?? a.district ?? a.city ?? null;
}

/** Finds the person's location (and a nearby street) when `active`; `refresh` asks again. */
export function useCurrentLocation(active: boolean) {
  const [location, setLocation] = useState<CurrentLocation>({ status: 'idle' });

  const refresh = useCallback(async () => {
    setLocation({ status: 'locating' });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation({ status: 'denied' });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude, accuracy } = pos.coords;
      let place: string | null = null;
      try {
        place = describePlace((await Location.reverseGeocodeAsync({ latitude, longitude }))[0]);
      } catch {
        // The street name is a nicety; the coordinates are what the report needs.
      }
      setLocation({ status: 'ready', latitude, longitude, accuracy, place });
    } catch {
      setLocation({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    if (active && location.status === 'idle') refresh();
  }, [active, location.status, refresh]);

  return { location, refresh };
}
