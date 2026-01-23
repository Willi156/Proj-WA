import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment/environment';

import { Game } from '../games/models/game.model';
import { Film } from '../film/model/film.model';
import {SerieTv} from '../serieTV/model/serie-tv.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getGiochi() {
    return this.http.get<Game[]>(`${this.baseUrl}/api/contenuti/giochi`);
  }

  getFilm() {
    return this.http.get<Film[]>(`${this.baseUrl}/api/contenuti/film`);
  }

  getSerieTv() {
    return this.http.get<SerieTv[]>(`${this.baseUrl}/api/contenuti/serie_tv`);
  }

  getAllContenuti() {
    return this.http.get<any>(`${this.baseUrl}/api/contenuti`);
  }

}
