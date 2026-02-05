export interface SerieTv {
  id: number;
  titolo: string;
  annoPubblicazione?: number;
  descrizione?: string;
  genere?: string;
  link?: string;
  imageLink?: string;
  mediaVoti?: number;

  in_corso?: boolean;
  stagioni?: number;
}
