
export interface DJ {
  id: string;
  name: string;
  email?: string; // Added for password recovery
  logo: string;
  bio: string;
  password?: string; // For mock client-side auth
  mixcloud?: string;
  personalGallery: string[];
  socials: {
    instagram?: string;
    facebook?: string;
    mixcloud?: string;
  };
}

export interface EventListing {
  id: string;
  title: string;
  djId: string;
  date: string;
  location: string;
  flyer: string;
}

export interface UpdatePost {
  id: string;
  title: string;
  content: string;
  date: string;
  image?: string;
}

export interface AzuraCastNowPlaying {
  station: {
    id: number;
    name: string;
    shortcode: string;
    listen_url: string;
  };
  now_playing: {
    elapsed: number; // Current position in song (seconds)
    duration: number; // Total song length (seconds)
    song: {
      title: string;
      artist: string;
      art: string;
    };
  };
  live: {
    is_live: boolean;
    streamer_name: string;
  } | null;
}

export interface GalleryItem {
  id: string;
  url: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  userEmail: string;
  userName: string;
  text: string;
  timestamp: number;
  isDJ?: boolean;
}
