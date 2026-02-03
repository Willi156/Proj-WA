export interface Game {
  id: number;
  titolo: string;
  descrizione: string;
  genere: string;
  tipo: string;
  annoPubblicazione: number;
  mediaVoti?: number;
  imageLink?: string;
  piattaforme?: string[];
}
