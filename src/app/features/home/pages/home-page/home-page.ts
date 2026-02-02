import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselSectionComponent } from '../../components/carousel-section/carousel-section';
import { ApiService } from '../../../../services/api.service';
import { MediaItem } from '../../../../shared/models/media-item';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';

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

  trendingGames$!: Observable<MediaItem[]>;
  trendingMovies$!: Observable<MediaItem[]>;
  trendingSeries$!: Observable<MediaItem[]>;

  constructor(private api: ApiService) {
    this.trendingGames$ = this.api.getGiochi().pipe(
      map((res: any) => this.extractArray(res).slice(0, 15)),


      map(arr => this.removeDuplicateImages(arr, 'imageLink')),

      map(arr => arr.map(g => this.gameToMediaItem(g))),
      map(items => {
        this.gamesLoading = false;
        return items;
      }),
      shareReplay(1),
      catchError(err => {
        console.error('Errore getGiochi()', err);
        this.gamesLoading = false;
        this.gamesError = 'Errore nel caricamento giochi';
        return of([] as MediaItem[]);
      })
    );

    this.trendingMovies$ = this.api.getFilm().pipe(
      map((res: any) => this.extractArray(res).slice(0, 15)),
      map(arr => arr.map(m => this.movieToMediaItem(m))),
      map(items => {
        this.moviesLoading = false;
        return items;
      }),
      shareReplay(1),
      catchError(err => {
        console.error('Errore getFilm()', err);
        this.moviesLoading = false;
        this.moviesError = 'Errore nel caricamento film';
        return of([] as MediaItem[]);
      })
    );

    this.trendingSeries$ = this.api.getSerieTv().pipe(
      map((res: any) => this.extractArray(res).slice(0, 15)),
      map(arr => arr.map(s => this.seriesToMediaItem(s))),
      map(items => {
        this.seriesLoading = false;
        return items;
      }),
      shareReplay(1),
      catchError(err => {
        console.error('Errore getSerieTv()', err);
        this.seriesLoading = false;
        this.seriesError = 'Errore nel caricamento serie TV';
        return of([] as MediaItem[]);
      })
    );
  }
  private extractArray(res: any): any[] {
    if (Array.isArray(res)) return res;
    return (
      res?.data ??
      res?.content ??
      res?.giochi ??
      res?.film ??
      res?.serie ??
      res?.results ??
      res?.result ??
      []
    );
  }
  private normalizeImageUrl(raw: any): string {
    if (!raw || typeof raw !== 'string') return '';

    let url = raw.trim();
    if (url.startsWith('/')) {
      url = `https://proj-wa-back-end-production.up.railway.app${url}`;
    }
    if (url.startsWith('https://')) {
      url = 'https://' + url.slice('https://'.length);
    }

    // deve essere http(s)
    if (!url.startsWith('https://') && !url.startsWith('https://')) return '';

    return url;
  }
  private removeDuplicateImages<T extends Record<string, any>>(arr: T[], key: string): T[] {
    const used = new Set<string>();
    return arr.map((obj) => {
      const raw = obj?.[key];
      const url = typeof raw === 'string' ? raw.trim() : '';
      if (url && used.has(url)) {
        return { ...obj, [key]: '' };
      }
      if (url) used.add(url);
      return obj;
    });
  }
  private gameToMediaItem(g: any): MediaItem {
    const image = this.normalizeImageUrl(g?.imageLink);
    return {
      id: g?.id ?? 0,
      title: g?.titolo ?? 'Senza titolo',
      type: 'GAME',
      coverUrl: image,
      imageUrl: image,
      criticScore: Math.max(1, Math.min(10, Number(g?.mediaVoti ?? 0) + 2)),
    } as MediaItem;
  }
  private movieToMediaItem(m: any): MediaItem {
    const image = this.normalizeImageUrl(m?.imageLink);
    return {
      id: m?.id ?? 0,
      title: m?.titolo ?? 'Senza titolo',
      type: 'MOVIE',
      coverUrl: image,
      imageUrl: image,
      criticScore: Math.max(1, Math.min(10, Number(m?.mediaVoti ?? 0) + 2)),
    } as MediaItem;
  }
  private seriesToMediaItem(s: any): MediaItem {
    const image = this.normalizeImageUrl(s?.imageLink);
    return {
      id: s?.id ?? 0,
      title: s?.titolo ?? 'Senza titolo',
      type: 'SERIES',
      coverUrl: image,
      imageUrl: image,
      criticScore: Math.max(1, Math.min(10, Number(s?.mediaVoti ?? 0) + 2)),
    } as MediaItem;
  }
}
