import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselSectionComponent } from '../../components/carousel-section/carousel-section';
import { ApiService } from '../../../../services/api.service';
import { MediaItem } from '../../../../shared/models/media-item';
import { Observable, catchError, map, of, shareReplay, take } from 'rxjs';
import { OverlayDetails } from '../../../../overlay-details/overlay-details';


@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, CarouselSectionComponent, OverlayDetails],
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

  // ✅ stato “modal” (per ora tipizzato any, così compila anche senza componente modal importato)
  detailsLoading = false;
  detailsError = '';

  // ✅ stato modal
  modalOpen = false;
  selectedContent: any = null;

  // ✅ prev/next
  private currentList: any[] = [];
  private currentIndex = 0;


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

  openFromCarousel(kind: 'GAME' | 'MOVIE' | 'SERIES', item: MediaItem, index: number) {
    const source$ =
      kind === 'GAME' ? this.trendingGames$ :
        kind === 'MOVIE' ? this.trendingMovies$ :
          this.trendingSeries$;

    source$.pipe(take(1)).subscribe(list => {
      // lista per prev/next
      this.currentList = list.map(mi => this.mediaItemToContentItem(mi));
      this.currentIndex = Math.max(0, Math.min(index, this.currentList.length - 1));

      // apri SUBITO overlay con dati base
      this.selectedContent = this.currentList[this.currentIndex] ?? null;
      this.modalOpen = true;

      const contenutoId = Number(item.id);
      if (!contenutoId) return;

      // ✅ 1) carica dettagli completi dal DB
      this.api.getContenutoById(contenutoId).pipe(take(1)).subscribe({
        next: (full: any) => {
          console.log('DETTAGLIO DAL DB:', full);
          this.selectedContent = {
            ...this.selectedContent,
            title: full?.titolo ?? this.selectedContent?.title,
            description: full?.descrizione ?? this.selectedContent?.description,
            genre: full?.genere ?? this.selectedContent?.genre,
            year: full?.annoPubblicazione ?? this.selectedContent?.year,
            cover: this.normalizeImageUrl(full?.link) || this.selectedContent?.cover,
          };

          this.currentList[this.currentIndex] = this.selectedContent;
        },

        error: (err: any) => console.error('Errore dettaglio contenuto', err),
      });

      // ✅ 2) carica recensioni dal DB (hai già l’endpoint)
      this.api.getRecensioniByContenutoId(contenutoId).pipe(take(1)).subscribe({
        next: (reviews: any[]) => {
          this.selectedContent = { ...this.selectedContent, reviews: reviews ?? [] };
          this.currentList[this.currentIndex] = this.selectedContent;
        },
        error: (err: any) => console.error('Errore recensioni', err),
      });
    });
  }


  goPrev() {
    if (!this.currentList.length) return;
    if (this.currentIndex <= 0) return;
    this.currentIndex--;
    this.selectedContent = this.currentList[this.currentIndex];
  }

  goNext() {
    if (!this.currentList.length) return;
    if (this.currentIndex >= this.currentList.length - 1) return;
    this.currentIndex++;
    this.selectedContent = this.currentList[this.currentIndex];
  }

  // per ora accetta qualsiasi payload (quando colleghi il vero modal, lo tipizziamo)
  sendReview(payload: any) {
    console.log('Recensione ricevuta:', payload);

    if (!this.selectedContent) return;

    const newReview = {
      user: 'Tu',
      rating: payload?.rating,
      comment: payload?.comment,
      date: new Date().toLocaleDateString('it-IT'),
    };

    const reviews = this.selectedContent.reviews ?? [];
    this.selectedContent = { ...this.selectedContent, reviews: [newReview, ...reviews] };
    this.currentList[this.currentIndex] = this.selectedContent;
  }

  private mediaItemToContentItem(mi: MediaItem): any {
    return {
      id: mi.id,
      cover: mi.coverUrl || mi.imageUrl || '',
      title: mi.title,
      type: mi.type === 'GAME' ? 'Gioco' : mi.type === 'MOVIE' ? 'Film' : 'Serie',
      year: '',
      genre: '',
      rating: (mi as any).criticScore ?? undefined,
      description: '',
      available: true,
      reviews: [],
    };
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
    if (url.startsWith('http://')) {
      url = 'https://' + url.slice('http://'.length);
    }
    if (!url.startsWith('https://') && !url.startsWith('http://')) return '';

    return url;
  }

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
