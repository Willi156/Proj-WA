export interface Film {
  id: number;
  titolo: string;
  annoPubblicazione?: number;
  descrizione?: string;
  genere?: string;
  link?: string;
  tipo: 'GIOCO' | 'FILM' | 'SERIE_TV';
  imageLink?: string;
  mediaVoti?: number;
}

