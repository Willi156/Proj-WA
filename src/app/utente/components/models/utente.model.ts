export interface IContenutoPreferito {
  id?: number;
  titolo?: string;
  tipo?: string;
}

export interface IRecensioneUtente {
  contenuto: IContenuto;
  recensione: IRecensione;
}

export interface IContenuto {
  annoPubblicazione?: number;
  casaEditrice?: string;
  casaProduzione?: string;
  descrizione?: string;
  genere?: string;
  id: number;
  imageLink?: string;
  inCorso?: boolean;
  link?: string;
  mediaVoti?: number ;
  stagioni?: number;
  tipo?: string;
  titolo?: string;
}

export interface IRecensione {
  data?: string;
  idContenuto?: number;
  id?: number;
  idUtente?: number;
  testo?: string;
  titolo?: string;
  username?: string;
  voto?: number;
}

