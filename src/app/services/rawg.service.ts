import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import {environment} from '../../environment/environment';

@Injectable({ providedIn: 'root' })
export class RawgService {
  private API_KEY = environment.rawgApiKey;
  private BASE_URL = 'https://api.rawg.io/api/games';

  constructor(private http: HttpClient) {}

  getImageByTitle(title: string) {
    return this.http
      .get<any>(`${this.BASE_URL}?search=${encodeURIComponent(title)}&page_size=1&key=${this.API_KEY}`)
      .pipe(
        map(res => res.results?.[0]?.background_image ?? null)
      );
  }
}
