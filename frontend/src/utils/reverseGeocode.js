import { getCurrentPosition } from '../services/location';

export const getCurrentState = async () => {
  try {
    const { lat, lng } = await getCurrentPosition(2);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
    );
    const data = await response.json();
    let state = data.address?.state;
    if (state === 'Federal Capital Territory') state = 'FCT';
    if (state && typeof state === 'string') return state;
    return 'Lagos';
  } catch (error) {
    console.warn('Reverse geocode failed, defaulting to Lagos', error);
    return 'Lagos';
  }
};