import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../environment/environment';


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


  private getGameIdByTitle(title: string) {
    if (!title?.trim()) return of<number | null>(null);

    return this.http
      .get<any>(`${this.BASE_URL}?search=${encodeURIComponent(title)}&page_size=1&key=${this.API_KEY}`)
      .pipe(
        map(res => res.results?.[0]?.id ?? null),
        catchError(() => of(null))
      );
  }

  getTrailerUrlByTitle(title: string) {
    return this.getGameIdByTitle(title).pipe(
      switchMap((id) => {
        if (!id) return of(null);

        // 1) PROVO /movies
        return this.http
          .get<any>(`${this.BASE_URL}/${id}/movies?key=${this.API_KEY}`)
          .pipe(
            map(res => {
              const first = res?.results?.[0];

              const url =
                first?.data?.max ??
                first?.data?.['480'] ??
                first?.data?.['720'] ??
                first?.preview ??
                null;

              return url ? String(url) : null;
            }),
            catchError(() => of(null)),

            // 2) FALLBACK: se /movies è vuoto -> provo /games/{id} e leggo clip
            switchMap((movieUrl: string | null) => {
              if (movieUrl) return of(movieUrl);

              return this.http
                .get<any>(`${this.BASE_URL}/${id}?key=${this.API_KEY}`)
                .pipe(
                  map(game => {
                    const clip =
                      game?.clip?.clip ??
                      game?.clip?.clips?.full ??
                      game?.clip?.clips?.['640'] ??
                      game?.clip?.clips?.['320'] ??
                      null;

                    return clip ? String(clip) : null;
                  }),
                  catchError(() => of(null))
                );
            })
          );
      })
    );
  }

}
