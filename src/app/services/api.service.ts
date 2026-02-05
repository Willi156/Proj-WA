import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environment/environment';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { Game } from '../games/models/game.model';
import { Film } from '../film/model/film.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiBaseUrl;


  public datiCache: any = {
    recensioni: null,
    preferiti: null
  };

  constructor(private http: HttpClient) {}


  clearCache() {
    this.datiCache.recensioni = null;
    this.datiCache.preferiti = null;
  }

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

  getCheckUsername(username: string) {
    return this.http.get<{ available: boolean }>(
      `${this.baseUrl}/api/utente/checkUsernameExists`,
      { params: { username } }
    );
  }

  createUser(nome: string, cognome: string, username: string, password: string, email: string) {
    return this.http.post<{ id: number }>(
      `${this.baseUrl}/api/newUtente`,
      { nome, cognome, email, username, password }
    );
  }

  updateUserInfo(userId: number, nome: string, cognome: string, email: string, immagineProfilo?: string) {
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



  getContenuti() {
    return this.http.get<any[]>(`${this.baseUrl}/api/contenuti`);
  }

  getContenutoById(id: number) {
    return this.http.get<any>(`${this.baseUrl}/api/contenuto/${id}`, { withCredentials: true });
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

  updateContenuto(
    id: number,
    titolo: string,
    descrizione: string,
    genere: string,
    link: string,
    tipo: string,
    annoPubblicazione: number,
    imageLink?: string,
    casaProduzione?: string,
    casaEditrice?: string,
    inCorso?: boolean,
    stagioni?: number,
    piattaformaIds?: number[]
  ) {
    return this.http.put<{ success: boolean }>(
      `${this.baseUrl}/api/contenuto/update/${id}`,
      { titolo, descrizione, genere, link, tipo, annoPubblicazione, casaProduzione, casaEditrice, inCorso, stagioni, imageLink, piattaformaIds },
      { withCredentials: true }
    );
  }


  deleteContenutoById(id: number) {
    return this.http.delete<{ success: boolean }>(
      `${this.baseUrl}/api/contenuto/delete/${id}`,
      { withCredentials: true }
    );
  }

  createContenuto(
    titolo: string,
    descrizione: string,
    genere: string,
    link: string,
    tipo: string,
    annoPubblicazione: number,
    imageLink?: string,
    casaProduzione?: string,
    casaEditrice?: string,
    inCorso?: boolean,
    stagioni?: number,
    piattaformaIds?: number[]
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
        imageLink,
        casaProduzione,
        casaEditrice,
        inCorso,
        stagioni,
        piattaformaIds
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

  getPiattaformeWithIds() {
    return this.http.get<any[]>(
      `${this.baseUrl}/api/piattaforme/complete`,
      { withCredentials: true }
    );
  }


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

  addRecensione(idContenuto: number, idUtente: number, voto: number, testo: string, titolo: string, data?: Date) {
    return this.http.post<{ id: number }>(
      `${this.baseUrl}/api/recensione/new`,
      { idContenuto, idUtente, voto, testo, titolo, data },
      { withCredentials: true }
    ).pipe(tap(() => this.clearCache()));
  }

  updateRecensione(id: number, voto: number, testo: string, titolo: string, data?: Date) {
    return this.http.put<{ success: boolean }>(
      `${this.baseUrl}/api/recensioni/update/${id}`,
      { voto, testo, titolo, data },
      { withCredentials: true }
    ).pipe(tap(() => this.clearCache()));
  }

  deleteRecensione(id: number) {
    return this.http.delete<{ success: boolean }>(
      `${this.baseUrl}/api/recensioni/delete/${id}`,
      { withCredentials: true }
    ).pipe(tap(() => this.clearCache()));
  }


  getFavouritesMediaByUserId(userId: number) {
    return this.http.get<any[]>(
      `${this.baseUrl}/api/utente/${userId}/preferiti`,
      { withCredentials: true }
    );
  }

  addMediaToFavourites(userId: number, contenutoId: number) {
    return this.http.post(
      `${this.baseUrl}/api/utente/${userId}/addPreferito`,
      { contenutoId },
      { withCredentials: true }
    ).pipe(tap(() => this.clearCache()));
  }

  removeMediaFromFavourites(userId: number, contenutoId: number) {
    return this.http.delete(
      `${this.baseUrl}/api/utente/${userId}/removePreferito`,
      {
        body: { contenutoId },
        withCredentials: true
      }
    ).pipe(tap(() => this.clearCache()));
  }

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

  getFavouriteMediaByUserIdComplete(userId: number) {
    return this.http.get<any[]>(`${this.baseUrl}/api/utente/${userId}/preferitiCompleti`, { withCredentials: true });
  }

  getCurrentUserInfo() {
    return this.http.get<any>(`${this.baseUrl}/api/auth/me`, { withCredentials: true });
  }
}
