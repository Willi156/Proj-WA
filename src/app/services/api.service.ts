import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment/environment';
import { Game } from '../games/models/game.model';
import { Film } from '../film/model/film.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  authenticate(username: string, password: string) {
    return this.http.post<any>(
      `${this.baseUrl}/api/auth/login`,
      { username, password },
      { withCredentials: true }
    );
  }

  getCurrentUserInfo() {
    return this.http.get<any>(`${this.baseUrl}/api/auth/me`, { withCredentials: true });
  }

  getFavouritesMediaByUserId(userId: number) {
    return this.http.get<any[]>(`${this.baseUrl}/api/utente/${userId}/preferiti`, { withCredentials: true });
  }

  getFavouriteMediaByUserIdComplete(userId: number) {
    return this.http.get<any[]>(`${this.baseUrl}/api/utente/${userId}/preferitiCompleti`, { withCredentials: true });
  }

  getRecensioniByUserId(userId: number) {
    return this.http.get<any[]>(`${this.baseUrl}/api/recensioni/utente/${userId}`, { withCredentials: true });
  }

  getServerTime() {
    return this.http.get<{ serverTime: { now: string } }>(`${this.baseUrl}/api/test`);
  }

  getFirstUser() {
    return this.http.get<any>(`${this.baseUrl}/api/utente/first`);
  }

  newContenuto(titolo: string, descrizione: string, genere: string, link: string, tipo: string, annoPubblicazione: number, casaProduzione?: string, casaEditrice?: string, inCorso?: boolean, stagioni?: number) {
    return this.http.post<{ id: number }>(`${this.baseUrl}/api/newContenuto`, { titolo, descrizione, genere, link, tipo, annoPubblicazione, casaProduzione, casaEditrice, inCorso, stagioni }, { withCredentials: true });
  }

  getContenuti() {
    return this.http.get<any[]>(`${this.baseUrl}/api/contenuti`);
  }

  getGiochi() {
    return this.http.get<Game[]>(`${this.baseUrl}/api/contenuti/giochi`);
  }

  getFilm() {
    return this.http.get<Film[]>(`${this.baseUrl}/api/contenuti/film`);
  }

  getSerieTv() {
    return this.http.get<any[]>(`${this.baseUrl}/api/contenuti/serie_tv`);
  }

  getRecensioniByContenutoId(contenutoId: number) {
    return this.http.get<any[]>(`${this.baseUrl}/api/recensioni/contenuto`, { params: { contenutoId } });
  }

  getCheckUsername(username: string) {
    return this.http.get<{ available: boolean }>(`${this.baseUrl}/api/utente/checkUsernameExists`, { params: { username } });
  }

  createUser(nome: string, cognome: string, username: string, password: string, email: string) {
    return this.http.post<{ id: number }>(`${this.baseUrl}/api/newUtente`, { nome, cognome, email, username, password });
  }

  updateUtente(userId: number, dati: any) {
    return this.http.put<any>(`${this.baseUrl}/api/utente/${userId}`, dati);
  }

  updateUserInfo(userId: number, nome: string, cognome: string, email: string, immagineProfilo?: string) {
    return this.http.put<{ success: boolean }>(`${this.baseUrl}/api/utente/update/${userId}`, { nome, cognome, email, immagineProfilo }, { withCredentials: true });
  }


// AGGIORNAMENTO PASSWORD
  updateUserPassword(userId: number, password: string) {
    // Inviamo la password SIA nel body SIA come parametro nell'URL.
    // In questo modo, se il server la cerca in uno dei due posti, la trova sicuro.
    return this.http.put<{ success: boolean }>(
      `${this.baseUrl}/api/utente/update/${userId}/password`,
      { password }, // Tentativo 1: Nel Body
      {
        params: { password }, // Tentativo 2: Nell'URL (?password=...)
        withCredentials: true
      }
    );
  }

  checkUserPassword(userId: number, password: string) {
    return this.http.post<{ valid: boolean }>(
      `${this.baseUrl}/api/utente/${userId}/checkPassword`,
      { password },
      { withCredentials: true }
    );
  }
  // --- DELETE RECENSIONI (UFFICIALE) ---
  deleteRecensione(id: number) {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/api/recensioni/delete/${id}`, { withCredentials: true });
  }

  // --- DELETE PREFERITI (UFFICIALE) ---
  removeMediaFromFavourites(userId: number, contenutoId: number) {
    // Angular richiede che il body sia passato nelle opzioni per una DELETE
    return this.http.delete<{ success: boolean }>(
      `${this.baseUrl}/api/utente/${userId}/removePreferito`,
      {
        body: { contenutoId },
        withCredentials: true
      }
    );
  }

  // Esempio per futuri endpoint:
  // getItems() { return this.http.get<Item[]>(`${this.baseUrl}/api/items`); }
  // createItem(payload: ItemCreateDto) { return this.http.post(`${this.baseUrl}/api/items`, payload); }
}


