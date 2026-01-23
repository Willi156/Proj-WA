import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getGiochi(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/contenuti/giochi`);
  }

  getFilm(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/contenuti/film`);
  }

  getSerieTv(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/contenuti/serie_tv`);
  }

  getAllContenuti() {
    return this.http.get<any>(`${this.baseUrl}/api/contenuti`);
  }

}
