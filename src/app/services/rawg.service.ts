import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../environment/environment';

export type TrailerSource = 'RAWG' | 'YOUTUBE';
export type TrailerKind = 'MP4' | 'EMBED';

export type TrailerPick = {
  source: TrailerSource;
  kind: TrailerKind;
  url: string | null;
};

@Injectable({ providedIn: 'root' })
export class RawgService {
  private RAWG_KEY = environment.rawgApiKey;
  private YT_KEY = (environment as any).youtubeApiKey as string; // <- aggiungi in environment
  private BASE_URL = 'https://api.rawg.io/api/games';

  constructor(private http: HttpClient) {}

  getImageByTitle(title: string) {
    return this.http
      .get<any>(`${this.BASE_URL}?search=${encodeURIComponent(title)}&page_size=1&key=${this.RAWG_KEY}`)
      .pipe(map((res) => res.results?.[0]?.background_image ?? null));
  }

  private getGameIdByTitle(title: string) {
    if (!title?.trim()) return of<number | null>(null);

    return this.http
      .get<any>(`${this.BASE_URL}?search=${encodeURIComponent(title)}&page_size=1&key=${this.RAWG_KEY}`)
      .pipe(
        map((res) => res.results?.[0]?.id ?? null),
        catchError(() => of(null))
      );
  }

  /**
   * RAWG: prova prima /movies, poi fallback clip su /games/{id}
   * Ritorna un URL mp4 (o null).
   */
  getTrailerUrlByTitle(title: string): Observable<string | null> {
    const t = (title ?? '').trim();
    console.log('[RAWG] getTrailerUrlByTitle title:', t);

    return this.getGameIdByTitle(t).pipe(
      switchMap((id) => {
        console.log('[RAWG] resolved game id:', id);
        if (!id) return of(null);

        // 1) /movies
        return this.http.get<any>(`${this.BASE_URL}/${id}/movies?key=${this.RAWG_KEY}`).pipe(
          map((res) => {
            console.log('[RAWG] /movies response:', res);

            const first = res?.results?.[0];
            const url =
              first?.data?.max ??
              first?.data?.['720'] ??
              first?.data?.['480'] ??
              first?.preview ??
              null;

            console.log('[RAWG] /movies picked url:', url);
            return url ? String(url) : null;
          }),
          catchError((err) => {
            console.error('[RAWG] /movies error:', err);
            return of(null);
          }),

          // 2) fallback /games/{id} clip
          switchMap((movieUrl: string | null) => {
            if (movieUrl) return of(movieUrl);

            return this.http.get<any>(`${this.BASE_URL}/${id}?key=${this.RAWG_KEY}`).pipe(
              map((game) => {
                console.log('[RAWG] /games/{id} response clip:', game?.clip);

                const clip =
                  game?.clip?.clip ??
                  game?.clip?.clips?.full ??
                  game?.clip?.clips?.['640'] ??
                  game?.clip?.clips?.['320'] ??
                  null;

                console.log('[RAWG] /games/{id} picked clip:', clip);
                return clip ? String(clip) : null;
              }),
              catchError((err) => {
                console.error('[RAWG] /games/{id} error:', err);
                return of(null);
              })
            );
          })
        );
      })
    );
  }

  /**
   * YOUTUBE: cerca un videoId e costruisce l'embed URL.
   * NOTE: richiede YouTube Data API v3 abilitata e una API key.
   */
  private getYoutubeEmbedByQuery(query: string): Observable<string | null> {
    const q = (query ?? '').trim();
    if (!q) return of(null);

    if (!this.YT_KEY) {
      console.warn('[YOUTUBE] youtubeApiKey mancante in environment');
      return of(null);
    }

    return this.http
      .get<any>('https://www.googleapis.com/youtube/v3/search', {
        params: {
          key: this.YT_KEY,
          part: 'snippet',
          type: 'video',
          maxResults: 1,
          q,
          safeSearch: 'strict',
        },
      })
      .pipe(
        map((res) => {
          const videoId = res?.items?.[0]?.id?.videoId ?? null;
          const embed = videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null;
          console.log('[YOUTUBE] query:', q, 'videoId:', videoId, 'embed:', embed);
          return embed;
        }),
        catchError((err) => {
          console.error('[YOUTUBE] search error:', err);
          return of(null);
        })
      );
  }

  /**
   * ✅ SMART:
   * 1) prova RAWG (mp4)
   * 2) se vuoto -> fallback YouTube (embed)
   */
  getTrailerSmartByTitle(title: string): Observable<TrailerPick> {
    const t = (title ?? '').trim();
    if (!t) return of({ source: 'RAWG', kind: 'MP4', url: null } as const);

    return this.getTrailerUrlByTitle(t).pipe(
      switchMap((rawgUrl) => {
        if (rawgUrl) {
          const pick: TrailerPick = { source: 'RAWG', kind: 'MP4', url: rawgUrl };
          return of(pick);
        }

        console.log('[TRAILER][SMART] RAWG empty -> fallback YOUTUBE');
        const ytQuery = `${t} official trailer`;

        return this.getYoutubeEmbedByQuery(ytQuery).pipe(
          map((embedUrl) => {
            const pick: TrailerPick = { source: 'YOUTUBE', kind: 'EMBED', url: embedUrl };
            return pick;
          })
        );
      }),
      catchError(() => of({ source: 'RAWG', kind: 'MP4', url: null } as const))
    );
  }
  getUpcomingGames(pageSize: number = 40) {
    const today = new Date().toISOString().split('T')[0];

    return this.http.get<any>(this.BASE_URL, {
      params: {
        key: this.RAWG_KEY, // ✅
        dates: `${today},2027-12-31`,
        ordering: 'released',
        page_size: pageSize.toString()
      }
    }).pipe(
      map(res => res.results ?? [])
    );
  }

  getBestGames(options: {
    page?: number;
    pageSize?: number;
    fromYear?: number;
    toYear?: number;
  } = {}) {

    const {
      page = 1,
      pageSize = 40,
      fromYear = 1990,
      toYear = new Date().getFullYear()
    } = options;

    return this.http.get<any>(this.BASE_URL, {
      params: {
        key: this.RAWG_KEY,
        ordering: '-metacritic',
        page: page.toString(),
        page_size: pageSize.toString(),
        dates: `${fromYear}-01-01,${toYear}-12-31`
      }
    }).pipe(
      map(res => res.results ?? []),
      catchError(() => of([]))
    );
  }
  getGameBySlug(slug: string): Observable<any | null> {
    return this.http.get<any>(
      `https://api.rawg.io/api/games/${slug}`,
      { params: { key: this.RAWG_KEY } }
    ).pipe(
      catchError(() => of(null))
    );
  }



}
