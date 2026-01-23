export type MediaType = 'MOVIE' | 'SERIES' | 'GAME';

export interface MediaItem {
  id: number;
  title: string;
  type: MediaType;
  imageUrl: string;
  criticScore?: number;
}

export interface MediaItem {
  id: number;
  title: string;
  coverUrl: string;
}
