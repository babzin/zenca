import { getCurrentPosition } from '../services/location';

export const getCurrentState = async () => {
  try {
    const { lat, lng } = await getCurrentPosition(2); // retry up to 2 times
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
    );
    const data = await response.json();
    const state = data.address?.state;
    if (state && typeof state === 'string') return state;
    return 'Lagos'; // default fallback
  } catch (error) {
    console.warn('Reverse geocode failed, defaulting to Lagos', error);
    return 'Lagos';
  }
};