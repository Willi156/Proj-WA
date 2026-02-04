import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environment/environment';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { Game } from '../games/models/game.model';
import { Film } from '../film/model/film.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /* ======================
     AUTH
  ====================== */

  authenticate(username: string, password: string) {
    return this.http.post<any>(
      `${this.baseUrl}/api/auth/login`,
      { username, password },
      { withCredentials: true }
    );
  }

  me() {
    return this.http.get<{ user: any }>(
      `${this.baseUrl}/api/auth/me`,
      { withCredentials: true }
    );
  }

  /* ======================
     UTENTE
  ====================== */

  getCurrentUserInfo() {
    return this.http.get<any>(
      `${this.baseUrl}/api/auth/me`,
      { withCredentials: true }
    );
  }

  getCheckUsername(username: string) {
    return this.http.get<{ available: boolean }>(
      `${this.baseUrl}/api/utente/checkUsernameExists`,
      { params: { username } }
    );
  }

  createUser(
    nome: string,
    cognome: string,
    username: string,
    password: string,
    email: string
  ) {
    return this.http.post<{ id: number }>(
      `${this.baseUrl}/api/newUtente`,
      { nome, cognome, email, username, password }
    );
  }

  updateUtente(userId: number, dati: any) {
    return this.http.put<any>(
      `${this.baseUrl}/api/utente/${userId}`,
      dati
    );
  }

  updateUserInfo(
    userId: number,
    nome: string,
    cognome: string,
    email: string,
    immagineProfilo?: string
  ) {
    return this.http.put<{ success: boolean }>(
      `${this.baseUrl}/api/utente/update/${userId}`,
      { nome, cognome, email, immagineProfilo },
      { withCredentials: true }
    );
  }

  updateUserPassword(userId: number, password: string) {
    return this.http.put<{ success: boolean }>(
      `${this.baseUrl}/api/utente/update/${userId}/password`,
      { password },
      { withCredentials: true }
    );
  }

  checkUserPassword(userId: number, password: string) {
    return this.http.post<{ valid: boolean }>(
      `${this.baseUrl}/api/utente/${userId}/checkPassword`,
      { password },
      { withCredentials: true }
    );
  }

  /* ======================
     CONTENUTI
  ====================== */

  getContenuti() {
    return this.http.get<any[]>(
      `${this.baseUrl}/api/contenuti`
    );
  }

  getContenutoById(id: number) {
    return this.http.get<any>(
      `${this.baseUrl}/api/contenuti/${id}`
    );
  }

  getGiochi() {
    return this.http.get<Game[]>(
      `${this.baseUrl}/api/contenuti/giochi`
    );
  }

  getFilm() {
    return this.http.get<Film[]>(
      `${this.baseUrl}/api/contenuti/film`
    );
  }

  getSerieTv() {
    return this.http.get<any[]>(
      `${this.baseUrl}/api/contenuti/serie_tv`
    );
  }

  newContenuto(
    titolo: string,
    descrizione: string,
    genere: string,
    link: string,
    tipo: string,
    annoPubblicazione: number,
    casaProduzione?: string,
    casaEditrice?: string,
    inCorso?: boolean,
    stagioni?: number
  ) {
    return this.http.post<{ id: number }>(
      `${this.baseUrl}/api/newContenuto`,
      {
        titolo,
        descrizione,
        genere,
        link,
        tipo,
        annoPubblicazione,
        casaProduzione,
        casaEditrice,
        inCorso,
        stagioni
      },
      { withCredentials: true }
    );
  }

  searchContenuti(query: string) {
    return this.http.get<any[]>(
      `${this.baseUrl}/api/contenuti/search`,
      { params: { q: query } }
    );
  }

  /* ======================
     GENERI / PIATTAFORME
  ====================== */

  getGeneriGiochi() {
    return this.http.get<string[]>(
      `${this.baseUrl}/api/contenuti/giochi/generi`
    );
  }

  getPiattaformeName() {
    return this.http.get<string[]>(
      `${this.baseUrl}/api/piattaforme/nomi`
    );
  }

  /* ======================
     RECENSIONI
  ====================== */

  getRecensioniByContenutoId(contenutoId: number) {
    return this.http.get<any[]>(
      `${this.baseUrl}/api/recensioni/contenuto`,
      { params: { contenutoId } }
    );
  }

  getRecensioniByUserId(userId: number) {
    return this.http.get<any[]>(
      `${this.baseUrl}/api/recensioni/utente/${userId}`,
      { withCredentials: true }
    );
  }

  addRecensione(
    idContenuto: number,
    idUtente: number,
    voto: number,
    testo: string,
    titolo: string,
    data?: Date
  ) {
    return this.http.post<{ id: number }>(
      `${this.baseUrl}/api/recensione/new`,
      { idContenuto, idUtente, voto, testo, titolo, data },
      { withCredentials: true }
    );
  }

  deleteRecensione(id: number) {
    return this.http.delete<{ success: boolean }>(
      `${this.baseUrl}/api/recensioni/delete/${id}`,
      { withCredentials: true }
    );
  }

  /* ======================
     PREFERITI
  ====================== */

  getFavouritesMediaByUserId(userId: number) {
    return this.http.get<any[]>(
      `${this.baseUrl}/api/utente/${userId}/preferiti`,
      { withCredentials: true }
    );
  }

  getFavouriteMediaByUserIdComplete(userId: number) {
    return this.http.get<any[]>(
      `${this.baseUrl}/api/utente/${userId}/preferitiCompleti`,
      { withCredentials: true }
    );
  }

  addMediaToFavourites(userId: number, contenutoId: number) {
    return this.http.post(
      `${this.baseUrl}/api/utente/${userId}/addPreferito`,
      { contenutoId },
      { withCredentials: true }
    );
  }

  removeMediaFromFavourites(userId: number, contenutoId: number) {
    return this.http.delete<{ success: boolean }>(
      `${this.baseUrl}/api/utente/${userId}/removePreferito`,
      {
        body: { contenutoId },
        withCredentials: true
      }
    );
  }

  /* ======================
     TRAILER
  ====================== */

  getTrailerEmbed(
    kind: 'GAME' | 'MOVIE' | 'SERIES',
    q: string,
    year?: number
  ): Observable<string | null> {

    const params = new HttpParams()
      .set('kind', kind)
      .set('q', q)
      .set('year', year ? String(year) : '');

    return this.http
      .get<{ embedUrl: string | null }>(
        `${this.baseUrl}/trailers/embed`,
        { params }
      )
      .pipe(
        map(res => res?.embedUrl ?? null),
        catchError(() => of(null))
      );
  }
}
