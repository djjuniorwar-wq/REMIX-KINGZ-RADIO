
import { DJ, EventListing, UpdatePost, GalleryItem, ChatMessage } from './types';

export const AZURACAST_API_URL = "https://demo.azuracast.com/api/nowplaying/1";
export const STATION_NAME = "REMIX KINGZ RADIO";
export const STATION_LOGO = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop"; 

export const STATION_SOCIALS = {
  instagram: "https://instagram.com/remixkingzradio",
  facebook: "https://facebook.com/remixkingzradio",
  twitter: "https://twitter.com/remixkingz",
  mixcloud: "https://mixcloud.com/remixkingz",
  youtube: "https://youtube.com/remixkingz"
};

export const DJS: DJ[] = Array.from({ length: 50 }, (_, i) => {
  const name = i === 0 ? "DJ REMIX KINGZ" : `KING DJ ${i + 1}`;
  return {
    id: `dj-${i + 1}`,
    name: name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@remixkingz.com`,
    logo: `https://picsum.photos/seed/dj-${i + 1}/600/600`,
    bio: "Legendary turntable specialist bringing high-energy mixes to the world. Catch me live every week on Remix Kingz Radio.",
    password: "kingz", // Default password for all mock DJs
    mixcloud: "https://mixcloud.com/remixkingz",
    personalGallery: [
      `https://picsum.photos/seed/pg-${i}-1/800/800`,
      `https://picsum.photos/seed/pg-${i}-2/800/800`,
      `https://picsum.photos/seed/pg-${i}-3/800/800`
    ],
    socials: {
      instagram: "https://instagram.com",
      facebook: "https://facebook.com",
      mixcloud: "https://mixcloud.com/remixkingz"
    }
  };
});

export const EVENTS: EventListing[] = [
  {
    id: "e1",
    title: "KINGZ OF THE NIGHT",
    djId: "dj-1",
    date: "2024-07-15",
    location: "Miami Beach Club",
    flyer: "https://picsum.photos/seed/event1/800/1200"
  },
  {
    id: "e2",
    title: "VIBES 24/7",
    djId: "dj-5",
    date: "2024-08-01",
    location: "The Underground NYC",
    flyer: "https://picsum.photos/seed/event2/800/1200"
  }
];

export const UPDATES: UpdatePost[] = [
  {
    id: "u1",
    title: "REMIX KINGZ APP LIVE",
    content: "Welcome to the all-new Remix Kingz Radio web app! Experience seamless streaming and catch your favorite DJs live.",
    date: "2024-05-20",
    image: "https://picsum.photos/seed/update1/1200/600"
  }
];

export const GALLERY: GalleryItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: `g-${i}`,
  url: `https://picsum.photos/seed/gallery-${i}/800/800`,
  description: `Remix Kingz Event Memory ${i + 1}`
}));

export const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 'm1',
    userEmail: 'support@remixkingz.com',
    userName: 'KING ADMIN',
    text: 'Welcome to the Kingdom Chat! 👑 Feel the vibes!',
    timestamp: Date.now() - 1000000,
    isDJ: true
  },
  {
    id: 'm2',
    userEmail: 'fan@example.com',
    userName: 'MixLover_24',
    text: 'This station is FIRE! 🔥 Loving the energy right now.',
    timestamp: Date.now() - 500000
  }
];
