export interface SerieTv {
  id: number;
  titolo: string;
  anno_pubblicazione?: number;
  descrizione?: string;
  genere?: string;
  link?: string;
  imageLink?: string;
  mediaVoti?: number;

  in_corso?: boolean;
  stagioni?: number;
}
