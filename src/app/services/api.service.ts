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

  //Aggiorna le informazioni dell'utente che non sia la password
  updateUserInfo(userId: number, nome: string, cognome: string, email: string, immagineProfilo?: string) {
    return this.http.put<{ success: boolean }>(`${this.baseUrl}/api/utente/update/${userId}`, { nome, cognome, email, immagineProfilo }, { withCredentials: true });
  }

//Chiamiamo questa API solo se effettivamente l'utente vuole cambiare la password, se le textfield rimangono vuote non la chiamiamo
//Aggiorna la password dell'utente però va utilizzata dopo aver verificato che la password attuale sia corretta
  updateUserPassword(userId: number, password: string) {
    return this.http.put<{ success: boolean }>(`${this.baseUrl}/api/utente/update/${userId}/password`, { password }, { withCredentials: true });
  }

//Verifica se la password fornita corrisponde a quella dell'utente a seguito si può cambiare la password ma solo se questa funzione ritorna true
  checkUserPassword(userId: number, password: string) {
    return this.http.post<{ valid: boolean }>(`${this.baseUrl}/api/utente/${userId}/checkPassword`, { password }, { withCredentials: true });
  }

  // Esempio per futuri endpoint:
  // getItems() { return this.http.get<Item[]>(`${this.baseUrl}/api/items`); }
  // createItem(payload: ItemCreateDto) { return this.http.post(`${this.baseUrl}/api/items`, payload); }
}
