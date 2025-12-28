
import { AzuraCastNowPlaying } from '../types';
import { AZURACAST_API_URL } from '../constants';

export async function fetchNowPlaying(): Promise<AzuraCastNowPlaying | null> {
  try {
    const response = await fetch(AZURACAST_API_URL);
    if (!response.ok) {
      throw new Error("Failed to fetch station data");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("AzuraCast Fetch Error:", error);
    return null;
  }
}
