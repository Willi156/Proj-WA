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


  // ==============================
// TRAILER (TMDB -> YouTube embed)
// ==============================
  getTrailerEmbedSmart(kind: 'MOVIE' | 'SERIES', title: string, year?: number) {
    const q = (title ?? '').trim();
    if (!q) return of<string | null>(null);

    const isMovie = kind === 'MOVIE';
    const searchUrl = `${this.BASE}/search/${isMovie ? 'movie' : 'tv'}`;

    // filtro anno per rendere la search più precisa
    const yearParamKey = isMovie ? 'primary_release_year' : 'first_air_date_year';

    const searchParams: any = {
      api_key: this.API_KEY,
      query: q,
      language: 'it-IT',
      page: 1,
    };
    if (year) searchParams[yearParamKey] = String(year);

    const pickId = (res: any) => Number(res?.results?.[0]?.id ?? 0) || null;

    const fetchVideos = (id: number, language: string) => {
      const videosUrl = `${this.BASE}/${isMovie ? 'movie' : 'tv'}/${id}/videos`;
      return this.http.get<any>(videosUrl, {
        params: { api_key: this.API_KEY, language },
      });
    };

    const pickYoutubeKey = (res: any): string | null => {
      const list = (res?.results ?? []) as any[];

      // preferenze: YouTube + Trailer, poi Teaser
      const yt = list.filter(v => (v?.site ?? '').toLowerCase() === 'youtube');

      const isTrailer = (v: any) => (v?.type ?? '').toLowerCase() === 'trailer';
      const isTeaser  = (v: any) => (v?.type ?? '').toLowerCase() === 'teaser';

      const officialFirst = (arr: any[]) =>
        [...arr].sort((a, b) => Number(!!b?.official) - Number(!!a?.official));

      const candidates =
        officialFirst(yt.filter(isTrailer)).length ? officialFirst(yt.filter(isTrailer)) :
          officialFirst(yt.filter(isTeaser)).length  ? officialFirst(yt.filter(isTeaser))  :
            officialFirst(yt);

      const key = candidates?.[0]?.key;
      return key ? String(key) : null;
    };

    const toEmbed = (key: string) => `https://www.youtube.com/embed/${key}?rel=0`;

    // 1) search IT -> id
    // 2) videos IT -> se vuoto, videos EN
    // 3) se ancora nulla, search EN -> videos EN
    return this.http.get<any>(searchUrl, { params: searchParams }).pipe(
      map(pickId),
      switchMap((id: number | null) => {
        if (!id) return of(null);

        return fetchVideos(id, 'it-IT').pipe(
          map((vr) => pickYoutubeKey(vr)),
          switchMap((keyIt) => {
            if (keyIt) return of(toEmbed(keyIt));

            return fetchVideos(id, 'en-US').pipe(
              map((vr) => pickYoutubeKey(vr)),
              map((keyEn) => (keyEn ? toEmbed(keyEn) : null)),
              catchError(() => of(null))
            );
          }),
          catchError(() => of(null))
        );
      }),
      switchMap((embedItOrNull) => {
        if (embedItOrNull) return of(embedItOrNull);

        // fallback: search EN
        const searchParamsEn: any = {
          api_key: this.API_KEY,
          query: q,
          language: 'en-US',
          page: 1,
        };
        if (year) searchParamsEn[yearParamKey] = String(year);

        return this.http.get<any>(searchUrl, { params: searchParamsEn }).pipe(
          map(pickId),
          switchMap((idEn: number | null) => {
            if (!idEn) return of(null);

            return fetchVideos(idEn, 'en-US').pipe(
              map((vr) => pickYoutubeKey(vr)),
              map((key) => (key ? toEmbed(key) : null)),
              catchError(() => of(null))
            );
          }),
          catchError(() => of(null))
        );
      }),
      catchError(() => of(null))
    );
  }

  getUpcomingMovies(pageSize = 40): Observable<any[]> {
    return this.http.get<any>(`${this.BASE}/movie/upcoming`, {
      params: {
        api_key: this.API_KEY,
        language: 'it-IT',
        region: 'IT',
        page: 1,
      },
    }).pipe(
      map(res => res?.results ?? [])
    );
  }
  getBestMovies(options?: {
    minVote?: number;
    minVotes?: number;
    fromYear?: number;
    toYear?: number;
    page?: number;
  }): Observable<any[]> {

    const {
      minVote = 7,
      minVotes = 500,
      fromYear = 1980,
      toYear = new Date().getFullYear(),
      page = 1
    } = options ?? {};

    return this.http.get<any>(`${this.BASE}/discover/movie`, {
      params: {
        api_key: this.API_KEY,
        language: 'it-IT',
        sort_by: 'vote_average.desc',
        'vote_average.gte': minVote.toString(),
        'vote_count.gte': minVotes.toString(),
        'primary_release_date.gte': `${fromYear}-01-01`,
        'primary_release_date.lte': `${toYear}-12-31`,
        page: page.toString()
      }
    }).pipe(
      map(res => res?.results ?? []),
      catchError(() => of([]))
    );
  }
  getMovieGenres(): Observable<Record<number, string>> {
    return this.http
      .get<any>(`${this.BASE}/genre/movie/list`, {
        params: {
          api_key: this.API_KEY,
          language: 'it-IT'
        }
      })
      .pipe(
        map(res => {
          const map: Record<number, string> = {};
          (res.genres ?? []).forEach((g: any) => {
            map[g.id] = g.name;
          });
          return map;
        })
      );
  }
  getUpcomingSeries(page = 1): Observable<any[]> {
    return this.http.get<any>(`${this.BASE}/tv/on_the_air`, {
      params: {
        api_key: this.API_KEY,
        language: 'it-IT',
        page: page.toString()
      }
    }).pipe(
      map(res => res?.results ?? [])
    );
  }
  getTvGenres(): Observable<Record<number, string>> {
    return this.http
      .get<any>(`${this.BASE}/genre/tv/list`, {
        params: {
          api_key: this.API_KEY,
          language: 'it-IT'
        }
      })
      .pipe(
        map(res => {
          const map: Record<number, string> = {};
          (res.genres ?? []).forEach((g: any) => {
            map[g.id] = g.name;
          });
          return map;
        })
      );
  }


}
