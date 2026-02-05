export interface TmdbMovie {
  id: number;
  titolo: string;
  annoPubblicazione: number | null;
  imageLink?: string;
  mediaVoti?: number | null;
  genres: string[];
}
