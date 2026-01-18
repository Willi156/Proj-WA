
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // Endpoint di test che abbiamo nel backend: /api/test
  getServerTime() {
    return this.http.get<{ serverTime: { now: string } }>(`${this.baseUrl}/api/test`);
  }
  
  getFirstUser() {
  return this.http.get<any>(`${this.baseUrl}/api/utente/first`);
}

 authenticate(username: string, password: string) {
    return this.http.post<{ token: string }>(`${this.baseUrl}/api/auth/login`, { username, password });
  }

  newContenuto(titolo: string, descrizione: string, genere: string, link: string, tipo: string, annoPubblicazione: number, casaProduzione?: string, casaEditrice?: string,inCorso?: boolean, stagioni?: number) {
    console.log('Creating new contenuto with casa produzione:', { casaProduzione});
    return this.http.post<{ id: number }>(`${this.baseUrl}/api/newContenuto`, { titolo, descrizione, genere, link, tipo, annoPubblicazione, casaProduzione, casaEditrice, inCorso, stagioni });
  }

  getContenuti() {
    return this.http.get<any[]>(`${this.baseUrl}/api/contenuti`);
  }

  getGiochi() {
    return this.http.get<any[]>(`${this.baseUrl}/api/contenuti/giochi`);
  }

  getFilm() {
    return this.http.get<any[]>(`${this.baseUrl}/api/contenuti/film`);
  }

  getSerieTv() {
    return this.http.get<any[]>(`${this.baseUrl}/api/contenuti/serie_tv`);
  }

  getRecensioniByContenutoId(contenutoId: number) {
    return this.http.get<any[]>(`${this.baseUrl}/api/recensioni/contenuto`,{params: {contenutoId}});
  }

  getCheckUsername(username: string) {
    return this.http.get<{ available: boolean }>(`${this.baseUrl}/api/utente/checkUsernameExists`, { params: { username } });
  }



  // Esempio per futuri endpoint:
  // getItems() { return this.http.get<Item[]>(`${this.baseUrl}/api/items`); }
  // createItem(payload: ItemCreateDto) { return this.http.post(`${this.baseUrl}/api/items`, payload); }
}
