import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CarouselSectionComponent } from '../../components/carousel-section/carousel-section';
import { ApiService } from '../../../../services/api.service';
import { RawgService } from '../../../../services/rawg.service';
import { MediaItem } from '../../../../shared/models/media-item';
import {
  Observable,
  catchError,
  finalize,
  forkJoin,
  map,
  of,
  shareReplay,
  switchMap,
} from 'rxjs';
import { IContenuto } from './IContenuto';

type MediaItemWithRaw = MediaItem & { raw: IContenuto };

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, CarouselSectionComponent],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePageComponent {
  gamesLoading = true;
  moviesLoading = true;
  seriesLoading = true;

  gamesError = '';
  moviesError = '';
  seriesError = '';

  trendingGames$!: Observable<MediaItemWithRaw[]>;
  trendingMovies$!: Observable<MediaItemWithRaw[]>;
  trendingSeries$!: Observable<MediaItemWithRaw[]>;

  constructor(
    private api: ApiService,
    private rawg: RawgService,
    private router: Router
  ) {
    // ✅ 1) CHIAMATA UNICA
    const contenuti$ = this.api.getContenuti().pipe(
      map((res: any) => this.extractArray(res) as IContenuto[]),
      shareReplay(1),
      catchError((err) => {
        console.error('Errore getContenuti()', err);

        this.gamesLoading = this.moviesLoading = this.seriesLoading = false;
        this.gamesError = this.moviesError = this.seriesError =
          'Errore nel caricamento contenuti';

        return of([] as IContenuto[]);
      })
    );

    // ✅ GAMES: placeholder + fix cover sbagliata via RAWG (getImageByTitle)
    this.trendingGames$ = contenuti$.pipe(
      map((arr) => this.byTipo(arr, 'GIOCO').slice(0, 15)),

      // 1) normalizzo cover (placeholder se manca)
      map((arr) =>
        arr.map((g) => ({
          ...g,
          imageLink: this.normalizeCover('GAME', g.imageLink),
        }))
      ),

      // 2) rimuovo duplicati (se duplicato -> vuoto) e poi rimetto placeholder
      map((arr) => this.removeDuplicateImages(arr, 'imageLink')),
      map((arr) =>
        arr.map((g) => ({
          ...g,
          imageLink: this.normalizeCover('GAME', g.imageLink),
        }))
      ),

      // 3) FIX cover sbagliata: chiedo a RAWG una cover per titolo e se arriva la uso
      switchMap((arr) => {
        const jobs = arr.map((g) => {
          const title = String(g.titolo ?? '').trim();
          if (!title) return of(g);

          return this.rawg.getImageByTitle(title).pipe(
            map((rawgCover: string | null) => {
              // se RAWG trova qualcosa, override (corregge cover errata DB)
              if (this.isValidCover(rawgCover)) {
                return { ...g, imageLink: String(rawgCover) };
              }
              return g;
            }),
            catchError(() => of(g))
          );
        });

        return forkJoin(jobs);
      }),

      // 4) mapping MediaItem
      map((arr) => arr.map((g) => this.gameToMediaItem(g))),

      finalize(() => {
        this.gamesLoading = false;
      }),
      catchError((err) => {
        console.error('Errore mapping giochi', err);
        this.gamesError = 'Errore nel caricamento giochi';
        return of([] as MediaItemWithRaw[]);
      })
    );

    // ✅ MOVIES: placeholder quando manca la cover
    this.trendingMovies$ = contenuti$.pipe(
      map((arr) => this.byTipo(arr, 'FILM').slice(0, 15)),

      map((arr) =>
        arr.map((m) => ({
          ...m,
          imageLink: this.normalizeCover('MOVIE', m.imageLink),
        }))
      ),

      map((arr) => this.removeDuplicateImages(arr, 'imageLink')),
      map((arr) =>
        arr.map((m) => ({
          ...m,
          imageLink: this.normalizeCover('MOVIE', m.imageLink),
        }))
      ),

      // Se vuoi SCARTARE i film senza cover reale (invece del placeholder), scommenta:
      // map(arr => arr.filter(m => !String(m.imageLink).includes('assets/placeholder-movie.jpg'))),

      map((arr) => arr.map((m) => this.movieToMediaItem(m))),

      finalize(() => {
        this.moviesLoading = false;
      }),
      catchError((err) => {
        console.error('Errore mapping film', err);
        this.moviesError = 'Errore nel caricamento film';
        return of([] as MediaItemWithRaw[]);
      })
    );

    // ✅ SERIES: placeholder quando manca la cover
    this.trendingSeries$ = contenuti$.pipe(
      map((arr) => this.byTipo(arr, 'SERIETV').slice(0, 15)),

      map((arr) =>
        arr.map((s) => ({
          ...s,
          imageLink: this.normalizeCover('SERIES', s.imageLink),
        }))
      ),

      map((arr) => this.removeDuplicateImages(arr, 'imageLink')),
      map((arr) =>
        arr.map((s) => ({
          ...s,
          imageLink: this.normalizeCover('SERIES', s.imageLink),
        }))
      ),

      map((arr) => arr.map((s) => this.seriesToMediaItem(s))),

      finalize(() => {
        this.seriesLoading = false;
      }),
      catchError((err) => {
        console.error('Errore mapping serie', err);
        this.seriesError = 'Errore nel caricamento serie TV';
        return of([] as MediaItemWithRaw[]);
      })
    );
  }

  // ✅ CLICK CARD: PASSO L’OGGETTO COMPLETO (IContenuto) nello state
  openFromCarousel(kind: 'GAME' | 'MOVIE' | 'SERIES', item: MediaItemWithRaw) {
    this.router.navigate(['/details', kind, item.id], {
      state: { contenuto: item.raw },
    });
  }

  // filtro robusto su tipo
  private byTipo(
    arr: IContenuto[],
    tipo: 'GIOCO' | 'FILM' | 'SERIETV'
  ): IContenuto[] {
    const normalize = (v: string) =>
      (v ?? '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '')
        .replace(/_/g, '');

    const t = normalize(tipo);

    const aliases: Record<string, string[]> = {
      GIOCO: ['GIOCO', 'GAME', 'VIDEOGAME'],
      FILM: ['FILM', 'MOVIE'],
      SERIETV: ['SERIETV', 'SERIE', 'SERIES', 'TVSERIES', 'SERIESTV', 'TV'],
    };

    const accepted = new Set((aliases[t] ?? [t]).map(normalize));

    return (arr ?? []).filter((x) => accepted.has(normalize(x.tipo ?? '')));
  }

  /** Supporta backend che ritorna [] oppure {data:[..]} / {content:[..]} / ecc. */
  private extractArray(res: any): any[] {
    if (Array.isArray(res)) return res;
    return res?.data ?? res?.content ?? res?.contenuti ?? res?.results ?? res?.result ?? [];
  }

  /** Normalizza URL immagine: https, path relativi */
  private normalizeImageUrl(raw: any): string {
    if (!raw || typeof raw !== 'string') return '';
    let url = raw.trim();

    if (url.startsWith('/')) {
      url = `https://proj-wa-back-end-production.up.railway.app${url}`;
    }
    if (url.startsWith('http://')) {
      url = 'https://' + url.slice('http://'.length);
    }
    if (!url.startsWith('https://') && !url.startsWith('http://')) return '';
    return url;
  }

  /** Rimuove immagini duplicate dentro una lista */
  private removeDuplicateImages<T extends Record<string, any>>(arr: T[], key: string): T[] {
    const used = new Set<string>();
    return arr.map((obj) => {
      const raw = obj?.[key];
      const url = typeof raw === 'string' ? raw.trim() : '';
      if (url && used.has(url)) return { ...obj, [key]: '' };
      if (url) used.add(url);
      return obj;
    });
  }

  // ✅ cover helpers (metodi, NON function dentro classe)

  private isValidCover(url: any): boolean {
    const u = String(url ?? '').trim();
    if (!u) return false;
    if (u === 'null' || u === 'undefined') return false;
    return /^https?:\/\//i.test(u) || u.startsWith('assets/');
  }

  private normalizeCover(kind: 'GAME' | 'MOVIE' | 'SERIES', rawUrl: any): string {
    const url = this.normalizeImageUrl(rawUrl);
    if (this.isValidCover(url)) return url;

    if (kind === 'GAME') return 'assets/placeholder-game.jpg';
    if (kind === 'MOVIE') return 'assets/placeholder-movie.jpg';
    return 'assets/placeholder-series.jpg';
  }

  // ✅ mappers: aggiungo raw = contenuto completo

  private gameToMediaItem(g: IContenuto): MediaItemWithRaw {
    const image = this.normalizeCover('GAME', g.imageLink);
    return {
      id: Number(g.id ?? 0),
      title: g.titolo ?? 'Senza titolo',
      type: 'GAME',
      coverUrl: image,
      imageUrl: image,
      criticScore: Math.max(1, Math.min(10, Math.round(Number(g.mediaVoti ?? 0) * 10) / 10)),
      raw: g,
    } as MediaItemWithRaw;
  }

  private movieToMediaItem(m: IContenuto): MediaItemWithRaw {
    const image = this.normalizeCover('MOVIE', m.imageLink);
    return {
      id: Number(m.id ?? 0),
      title: m.titolo ?? 'Senza titolo',
      type: 'MOVIE',
      coverUrl: image,
      imageUrl: image,
      criticScore: Math.max(1, Math.min(10, Math.round(Number(m.mediaVoti ?? 0) * 10) / 10)),
      raw: m,
    } as MediaItemWithRaw;
  }

  private seriesToMediaItem(s: IContenuto): MediaItemWithRaw {
    const image = this.normalizeCover('SERIES', s.imageLink);
    return {
      id: Number(s.id ?? 0),
      title: s.titolo ?? 'Senza titolo',
      type: 'SERIES',
      coverUrl: image,
      imageUrl: image,
      criticScore: Math.max(1, Math.min(10, Math.round(Number(s.mediaVoti ?? 0) * 10) / 10)),
      raw: s,
    } as MediaItemWithRaw;
  }
}
