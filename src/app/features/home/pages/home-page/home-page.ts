import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CarouselSectionComponent } from '../../components/carousel-section/carousel-section';
import { ApiService } from '../../../../services/api.service';
import { MediaItem } from '../../../../shared/models/media-item';
import { Observable, catchError, finalize, map, of, shareReplay } from 'rxjs';
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

  constructor(private api: ApiService, private router: Router) {
    // ✅ 1) CHIAMATA UNICA
    const contenuti$ = this.api.getContenuti().pipe(
      map((res: any) => this.extractArray(res) as IContenuto[]),
      shareReplay(1),
      catchError((err) => {
        console.error('Errore getContenuti()', err);

        this.gamesLoading = this.moviesLoading = this.seriesLoading = false;
        this.gamesError = this.moviesError = this.seriesError = 'Errore nel caricamento contenuti';

        return of([] as IContenuto[]);
      })
    );

    // ✅ 2) STREAM DERIVATI (DA CONTENUTI GIA' RECUPERATI)

    this.trendingGames$ = contenuti$.pipe(
      map(arr => this.byTipo(arr, 'GIOCO').slice(0, 15)),
      map(arr => this.removeDuplicateImages(arr, 'imageLink')),
      map(arr => arr.map(g => this.gameToMediaItem(g))),
      finalize(() => { this.gamesLoading = false; }),
      catchError((err) => {
        console.error('Errore mapping giochi', err);
        this.gamesError = 'Errore nel caricamento giochi';
        return of([] as MediaItemWithRaw[]);
      })
    );

    this.trendingMovies$ = contenuti$.pipe(
      map(arr => this.byTipo(arr, 'FILM').slice(0, 15)),
      map(arr => this.removeDuplicateImages(arr, 'imageLink')),
      map(arr => arr.map(m => this.movieToMediaItem(m))),
      finalize(() => { this.moviesLoading = false; }),
      catchError((err) => {
        console.error('Errore mapping film', err);
        this.moviesError = 'Errore nel caricamento film';
        return of([] as MediaItemWithRaw[]);
      })
    );

    this.trendingSeries$ = contenuti$.pipe(
      map(arr => this.byTipo(arr, 'SERIETV').slice(0, 15)),
      map(arr => this.removeDuplicateImages(arr, 'imageLink')),
      map(arr => arr.map(s => this.seriesToMediaItem(s))),
      finalize(() => { this.seriesLoading = false; }),
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
      state: { contenuto: item.raw } // ✅ qui c’è TUTTO il contenuto
    });
  }

  // filtro robusto su tipo
  private byTipo(arr: IContenuto[], tipo: 'GIOCO' | 'FILM' | 'SERIETV'): IContenuto[] {
    const normalize = (v: string) =>
      (v ?? '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '')   // toglie spazi
        .replace(/_/g, '');    // toglie underscore

    const t = normalize(tipo);

    const aliases: Record<string, string[]> = {
      GIOCO: ['GIOCO', 'GAME', 'VIDEOGAME'],
      FILM: ['FILM', 'MOVIE'],
      SERIETV: ['SERIETV', 'SERIE', 'SERIES', 'TVSERIES', 'SERIESTV', 'TV'],
    };

    const accepted = new Set((aliases[t] ?? [t]).map(normalize));

    return (arr ?? []).filter(x => accepted.has(normalize(x.tipo ?? '')));
  }


  /** Supporta backend che ritorna [] oppure {data:[..]} / {content:[..]} / ecc. */
  private extractArray(res: any): any[] {
    if (Array.isArray(res)) return res;
    return (
      res?.data ??
      res?.content ??
      res?.contenuti ??
      res?.results ??
      res?.result ??
      []
    );
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

  // ✅ mappers: aggiungo raw = contenuto completo

  private gameToMediaItem(g: IContenuto): MediaItemWithRaw {
    const image = this.normalizeImageUrl(g.imageLink);
    return {
      id: Number(g.id ?? 0),
      title: g.titolo ?? 'Senza titolo',
      type: 'GAME',
      coverUrl: image,
      imageUrl: image,
      criticScore: Math.max(
        1,
        Math.min(10, Math.round(Number(g.mediaVoti ?? 0) * 10) / 10)
      ),
      raw: g,
    } as MediaItemWithRaw;
  }

  private movieToMediaItem(m: IContenuto): MediaItemWithRaw {
    const image = this.normalizeImageUrl(m.imageLink);
    return {
      id: Number(m.id ?? 0),
      title: m.titolo ?? 'Senza titolo',
      type: 'MOVIE',
      coverUrl: image,
      imageUrl: image,
      criticScore: Math.max(
        1,
        Math.min(10, Math.round(Number(m.mediaVoti ?? 0) * 10) / 10)
      ),
      raw: m,
    } as MediaItemWithRaw;
  }

  private seriesToMediaItem(s: IContenuto): MediaItemWithRaw {
    const image = this.normalizeImageUrl(s.imageLink);
    return {
      id: Number(s.id ?? 0),
      title: s.titolo ?? 'Senza titolo',
      type: 'SERIES',
      coverUrl: image,
      imageUrl: image,
      criticScore: Math.max(
        1,
        Math.min(10, Math.round(Number(s.mediaVoti ?? 0) * 10) / 10)
      ),
      raw: s,
    } as MediaItemWithRaw;
  }
}
