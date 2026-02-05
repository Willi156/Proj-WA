import {PlatformKey} from '../utils/rawg-platform.util';


export interface RawgGame {
  id: number;
  slug: string;
  titolo: string;
  annoPubblicazione: number | null;
  imageLink?: string;
  genres: string[];
  platformKeys: PlatformKey[];
  mediaVoti?: number | null;
  gotyYear?: number;
}

