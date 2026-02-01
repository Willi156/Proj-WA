import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environment/environment';

import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class TmdbService {
  private API_KEY = environment.tmdbApiKey;
  private BASE = 'https://api.themoviedb.org/3';

  constructor(private http: HttpClient) {}

  // -----------------------------
  // ✅ Helper: cerca ID serie TV
  // -----------------------------
  private searchTvId(title: string, language: string): Observable<number | null> {
    const q = (title ?? '').trim();
    if (!q) return of(null);

    return this.http.get<any>(`${this.BASE}/search/tv`, {
      params: {
        api_key: this.API_KEY,
        query: q,
        language,
        page: 1,
      },
    }).pipe(
      map(res => Number(res?.results?.[0]?.id ?? 0) || null),
      catchError(() => of(null))
    );
  }

  // ---------------------------------------
  // ✅ Metodo robusto: IT -> EN + varianti
  // ---------------------------------------
  getTvStatsSmart(title: string) {
    const base = (title ?? '').trim();
    if (!base) return of({ seasons: 0, episodes: 0 });

    // Varianti utili (non aggressive: evitiamo di togliere troppo)
    const variants = [
      base,
      base.replace(/\s+-\s+/g, ': '),  // trattino -> due punti
      base.replace(/:\s+/g, ' - '),    // anche viceversa, per sicurezza
    ];

    // prova prima it-IT poi en-US, sulla prima variante che trova un id
    const tryFindId = (i: number): Observable<number | null> => {
      if (i >= variants.length) return of(null);

      const t = variants[i];

      return this.searchTvId(t, 'it-IT').pipe(
        switchMap((idIt) => {
          if (idIt) return of(idIt);
          return this.searchTvId(t, 'en-US');
        }),
        switchMap((id) => {
          if (id) return of(id);
          return tryFindId(i + 1); // prova variante successiva
        })
      );
    };

    return tryFindId(0).pipe(
      switchMap((id: number | null) => {
        if (!id) return of({ seasons: 0, episodes: 0 });

        return this.http.get<any>(`${this.BASE}/tv/${id}`, {
          params: {
            api_key: this.API_KEY,
            language: 'it-IT',
          },
        }).pipe(
          map(tv => ({
            seasons: Number(tv?.number_of_seasons ?? 0),
            episodes: Number(tv?.number_of_episodes ?? 0),
          })),
          catchError(() => of({ seasons: 0, episodes: 0 }))
        );
      }),
      catchError(() => of({ seasons: 0, episodes: 0 }))
    );
  }

  getWatchProvidersIT(kind: 'MOVIE' | 'SERIES', title: string) {
    const q = (title ?? '').trim();
    if (!q) return of([] as { label: string; url: string }[]);

    const isMovie = kind === 'MOVIE';
    const searchUrl = `${this.BASE}/search/${isMovie ? 'movie' : 'tv'}`;

    return this.http.get<any>(searchUrl, {
      params: {
        api_key: this.API_KEY,
        query: q,
        language: 'it-IT',
        page: 1,
      },
    }).pipe(
      map(res => res?.results?.[0]?.id ?? null),
      switchMap((id: number | null) => {
        if (!id) return of([] as { label: string; url: string }[]);

        const providersUrl = `${this.BASE}/${isMovie ? 'movie' : 'tv'}/${id}/watch/providers`;

        return this.http.get<any>(providersUrl, {
          params: { api_key: this.API_KEY },
        }).pipe(
          map(res => {
            const it = res?.results?.IT;
            if (!it) return [] as { label: string; url: string }[];

            const link: string | null = it?.link ?? null;

            // prendo flatrate + rent + buy (dedup)
            const list = [
              ...(it?.flatrate ?? []),
              ...(it?.rent ?? []),
              ...(it?.buy ?? []),
            ];

            const seen = new Set<number>();
            const out: { label: string; url: string }[] = [];

            for (const p of list) {
              const pid = Number(p?.provider_id ?? 0);
              if (!pid || seen.has(pid)) continue;
              seen.add(pid);

              const name = String(p?.provider_name ?? '').trim();
              if (!name) continue;

              // Se TMDB fornisce link per paese lo uso come destinazione
              // (è la pagina TMDB "watch" che rimanda ai provider)
              const url = link || `https://www.themoviedb.org/${isMovie ? 'movie' : 'tv'}/${id}/watch?locale=it-IT`;

              out.push({ label: name, url });
            }

            return out;
          }),
          catchError(() => of([] as { label: string; url: string }[]))
        );
      }),
      catchError(() => of([] as { label: string; url: string }[]))
    );
  }

  /**
   * ✅ Stats serie reali (IT):
   * number_of_seasons + number_of_episodes
   */
  getTvStatsIT(title: string) {
    const q = (title ?? '').trim();
    if (!q) return of({ seasons: 0, episodes: 0 });

    return this.http.get<any>(`${this.BASE}/search/tv`, {
      params: {
        api_key: this.API_KEY,
        query: q,
        language: 'it-IT',
        page: 1,
      },
    }).pipe(
      map(res => res?.results?.[0]?.id ?? null),
      switchMap((id: number | null) => {
        if (!id) return of({ seasons: 0, episodes: 0 });

        return this.http.get<any>(`${this.BASE}/tv/${id}`, {
          params: {
            api_key: this.API_KEY,
            language: 'it-IT',
          },
        }).pipe(
          map(tv => ({
            seasons: Number(tv?.number_of_seasons ?? 0),
            episodes: Number(tv?.number_of_episodes ?? 0),
          })),
          catchError(() => of({ seasons: 0, episodes: 0 }))
        );
      }),
      catchError(() => of({ seasons: 0, episodes: 0 }))
    );
  }
}
