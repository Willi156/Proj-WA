export interface Game {
  id: number;
  titolo: string;
  genere: string;
  annoPubblicazione: number;
  mediaVoti: number;
  descrizione: string;
  imageLink?: string;
  platform?: string[];
}

