import { Injectable } from '@angular/core';
import { HttpClient,HttpParams  } from '@angular/common/http';
import { environment } from '../../environment/environment';
import { Observable, of } from 'rxjs';
import { Game } from '../games/models/game.model';
import { Film } from '../film/model/film.model';
import { SerieTv } from '../serieTV/model/serie-tv.model';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getServerTime() {
    return this.http.get<{ serverTime: { now: string } }>(`${this.baseUrl}/api/test`);
  }

  getFirstUser() {
    return this.http.get<any>(`${this.baseUrl}/api/utente/first`);
  }

  authenticate(username: string, password: string) {
    return this.http.post<{ token: string }>(`${this.baseUrl}/api/auth/login`, { username, password });
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
    console.log('Creating new contenuto with casa produzione:', { casaProduzione });
    return this.http.post<{ id: number }>(`${this.baseUrl}/api/newContenuto`, {
      titolo,
      descrizione,
      genere,
      link,
      tipo,
      annoPubblicazione,
      casaProduzione,
      casaEditrice,
      inCorso,
      stagioni,
    });
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

    return this.http.get<SerieTv[]>(`${this.baseUrl}/api/contenuti/serie_tv`,{withCredentials:false});
  }

  getContenutoById(id: number) {
    return this.http.get<any>(`${this.baseUrl}/api/contenuti/${id}`);
  }

  getRecensioniByContenutoId(contenutoId: number) {
    return this.http.get<any[]>(`${this.baseUrl}/api/recensioni/contenuto`, {
      params: { contenutoId },
    });
  }

  getCheckUsername(username: string) {
    return this.http.get<{ available: boolean }>(`${this.baseUrl}/api/utente/checkUsernameExists`, {
      params: { username },
    });
  }

  createUser(nome: string, cognome: string, username: string, password: string, email: string) {
    return this.http.post<{ id: number }>(`${this.baseUrl}/api/newUtente`, {
      nome,
      cognome,
      email,
      username,
      password,
    });
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
      .get<{ embedUrl: string | null }>(`${this.baseUrl}/trailers/embed`, { params })
      .pipe(
        map((res) => (res?.embedUrl ? String(res.embedUrl) : null)),
        catchError(() => of(null))
      );
  }

  createRecensione(contenutoId: number, titolo: string, commento: string, voto: number, user?: string) {
    return this.http.post<any>(`${this.baseUrl}/api/recensioni/new`, {
      contenutoId,
      titolo,
      commento,
      voto,
      user, // se il backend lo ignora non fa nulla
    });
  }



}
