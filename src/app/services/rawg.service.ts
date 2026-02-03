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
  getUpcomingGames(pageSize: number = 40) {
    const today = new Date().toISOString().split('T')[0];

    return this.http.get<any>(this.BASE_URL, {
      params: {
        key: this.API_KEY,
        dates: `${today},2027-12-31`,
        ordering: 'released',
        page_size: pageSize.toString()
      }
    }).pipe(
      map(res => res.results ?? [])
    );
  }
  getBestGames(options: {
    pageSize?: number;
    fromYear?: number;
    toYear?: number;
  } = {}) {

    const {
      pageSize = 100,
      fromYear,
      toYear
    } = options;

    const params: any = {
      key: this.API_KEY,
      ordering: '-rating',
      page_size: pageSize.toString()
    };

    if (fromYear && toYear) {
      params.dates = `${fromYear}-01-01,${toYear}-12-31`;
    }

    return this.http.get<any>(this.BASE_URL, { params }).pipe(
      map(res => res.results ?? [])
    );
  }
}
