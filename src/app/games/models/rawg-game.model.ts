import {PlatformKey} from '../utils/rawg-platform.util';


export interface RawgGame {
  id: number;
  titolo: string;
  annoPubblicazione: number | null;
  imageLink?: string;
  mediaVoti?: number | null;
  genres: string[];
  platformKeys: PlatformKey[];
}
