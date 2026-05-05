export interface Event {
  id: number;
  slug: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location?: string;
  lat?: string;
  lng?: string;
  imageUrl?: string;
  blurHash?: string;
  type: 'event' | 'poi' | 'history';
  createdAt: number;
  updatedAt: number;
  published: 0 | 1;
}

export interface Match {
  id: number;
  slug: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  matchTime?: string;
  location?: string;
  description?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  coverImageUrl?: string;
  createdAt: number;
  updatedAt: number;
  published: 0 | 1;
}

export interface MatchPhoto {
  id: number;
  matchId: number;
  imageUrl: string;
  blurHash?: string;
  caption?: string;
  sortOrder: number;
  createdAt: number;
}

export interface Album {
  id: number;
  slug: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  createdAt: number;
  updatedAt: number;
  published: 0 | 1;
}

export interface AlbumPhoto {
  id: number;
  albumId: number;
  imageUrl: string;
  blurHash?: string;
  caption?: string;
  sortOrder: number;
  createdAt: number;
}

export interface Stamp {
  id: number;
  eventId: number;
  earnedAt: number;
  synced: 0 | 1;
}

export interface CityInfo {
  id: number;
  key: string;
  contentFr?: string;
  contentHt?: string;
  contentEs?: string;
  contentEn?: string;
  imageUrl?: string;
  updatedAt: number;
}

export interface Admin {
  id: number;
  username: string;
  credentialId: string;
  publicKey: string;
  createdAt: number;
}
