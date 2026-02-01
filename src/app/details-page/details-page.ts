import { ChangeDetectorRef, Component, Inject, NgZone, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { RawgService } from '../services/rawg.service';
import { ApiService } from '../services/api.service';
import { TmdbService } from '../services/tmdb.service';

import { finalize, timeout, catchError, of } from 'rxjs';

import { MockContent, MockKind, findMockContent } from '../mock/dati-mock-sample';
import { IContenuto } from '../features/home/pages/home-page/IContenuto';

type OpenSection = 'trailer' | 'write' | 'list' | null;

type Review = {
  id: number;
  idUtente: number;
  idContenuto: number;

  username: string;
  immagineProfilo?: string;

  titolo: string;
  testo: string;
  voto: number;

  data: string;
};


@Component({
  selector: 'app-details-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './details-page.html',
  styleUrl: './details-page.css',
})
export class DetailsPageComponent {
  loading = true;
  error = '';

  kind: 'GAME' | 'MOVIE' | 'SERIES' = 'GAME';
  id = 0;

  whereText = '—';

  contenuto: IContenuto | null = null;
  content: MockContent | null = null;

  // ✅ Recensioni dal DB
  reviews: Review[] = [];
  reviewsLoading = false;
  reviewsError = '';
  reviewsPosting = false;
  reviewsPostError = '';

  // ✅ UI: prime 5 + toggle “mostra altre”
  readonly initialReviewsCount = 5;
  showAllReviews = false;

  openSection: OpenSection = 'list';

  // Trailer
  trailerEmbed?: SafeResourceUrl;
  trailerMp4Url?: string;
  trailerLoading = false;
  trailerError = '';

  // Piattaforme
  platforms: { label: string; url: string }[] = [];
  platformsLoading = false;
  platformsError = '';

  // Stats serie (TMDB)
  seriesSeasons = 0;
  seriesEpisodes = 0;
  seriesStatsLoading = false;

  stars = Array.from({ length: 10 });

  reviewDraft: { title: string; rating: number; comment: string } = {
    title: '',
    rating: 0,
    comment: '',
  };

  private readonly isBrowser: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private api: ApiService,
    private rawg: RawgService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private tmdb: TmdbService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    const kindParam = (this.route.snapshot.paramMap.get('kind') || 'GAME').toUpperCase();
    const idParam = this.route.snapshot.paramMap.get('id') || '0';

    this.kind = (['GAME', 'MOVIE', 'SERIES'] as const).includes(kindParam as any)
      ? (kindParam as any)
      : 'GAME';

    this.id = Number(idParam) || 0;

    const navState = this.router.getCurrentNavigation()?.extras?.state as any;
    const passed =
      (navState?.contenuto as IContenuto) ??
      (this.isBrowser ? ((window.history.state?.contenuto as IContenuto) ?? null) : null);

    if (passed) {
      this.contenuto = passed;
      this.content = null;

      this.setupWhereText();

      this.loadPlatforms();
      this.loadSeriesStatsFromApi();
      this.loadTrailer();

      // ✅ recensioni DB
      this.loadReviewsFromApi();

      this.loading = false;
      this.error = '';
      return;
    }

    this.loadFromMock();
  }

  // ======================
  // ✅ REVIEWS: PRIME 5 + TOGGLE
  // ======================

  get visibleReviews(): Review[] {
    if (this.showAllReviews) return this.reviews;
    return this.reviews.slice(0, this.initialReviewsCount);
  }

  get hasMoreReviews(): boolean {
    return this.reviews.length > this.initialReviewsCount;
  }

  toggleMoreReviews() {
    this.showAllReviews = !this.showAllReviews;
  }

  // ======================
  // ✅ LOAD REVIEWS DAL DB
  // ======================
  private loadReviewsFromApi() {
    this.reviewsLoading = true;
    this.reviewsError = '';
    this.reviews = [];
    const contenutoId = Number(this.id);
    if (!contenutoId) {
      this.reviewsLoading = false;
      return;
    }

    this.api.getRecensioniByContenutoId(contenutoId).pipe(
      timeout(10000),
      catchError((err) => {
        console.error('getRecensioniByContenutoId error', err);
        this.reviewsError = 'Errore nel caricamento recensioni.';
        return of([] as any[]);
      }),
      finalize(() => {
        this.reviewsLoading = false;
        this.zone.run(() => this.cdr.markForCheck());
      })
    ).subscribe((list: any[]) => {

      // ✅ DEBUG: guarda cosa arriva davvero dal backend
      if (list && list.length > 0) {
        console.log('RECENSIONE RAW (prima):', list[1]);
      } else {
        console.log('NESSUNA RECENSIONE ARRIVATA DAL BACKEND');
      }

      // mapping come prima
      this.reviews = (list ?? []).map(r => this.mapReviewFromDb(r));

      // ordinamento newest-first
      this.reviews = [...this.reviews].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

      this.zone.run(() => this.cdr.markForCheck());
    });

  }

  private mapReviewFromDb(r: any): Review {
    return {
      id: Number(r?.id ?? 0),
      idUtente: Number(r?.idUtente ?? 0),
      idContenuto: Number(r?.idContenuto ?? 0),

      // ✅ username vero dal backend (fallback solo se manca)
      username: String(r?.username ?? '').trim() || `Utente #${r?.idUtente ?? '—'}`,
      immagineProfilo: String(r?.immagineProfilo ?? '').trim() || undefined,

      titolo: String(r?.titolo ?? ''),
      testo: String(r?.testo ?? ''),
      voto: Number(r?.voto ?? 0),

      data: this.normalizeDate(r?.data),
    };
  }




  private normalizeDate(v: any): string {
    if (typeof v === 'string' && v.includes('/')) return v;
    if (typeof v === 'string' && v.includes('-')) {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return this.formatDateDDMMYYYY(d);
    }
    const d = v ? new Date(v) : new Date();
    return this.formatDateDDMMYYYY(d);
  }

  submitReview() {
    const titolo = (this.reviewDraft.title || '').trim();
    const commento = (this.reviewDraft.comment || '').trim();
    const voto = Number(this.reviewDraft.rating);

    if (!titolo || !commento || !(voto >= 1 && voto <= 10)) return;

    const contenutoId = Number(this.id);
    if (!contenutoId) return;

    this.reviewsPosting = true;
    this.reviewsPostError = '';

    this.api.createRecensione(contenutoId, titolo, commento, voto, 'Anonimo').pipe(
      timeout(10000),
      catchError((err) => {
        console.error('createRecensione error', err);
        this.reviewsPostError = 'Errore durante la pubblicazione.';
        return of(null);
      }),
      finalize(() => {
        this.reviewsPosting = false;
        this.zone.run(() => this.cdr.markForCheck());
      })
    ).subscribe(() => {
      this.resetDraft();
      this.openSection = 'list';
      this.loadReviewsFromApi(); // ✅ ricarico dal DB
    });
  }

  resetDraft() {
    this.reviewDraft = { title: '', rating: 0, comment: '' };
  }

  setRating(n: number) {
    this.reviewDraft.rating = n;
  }

  // ======================
  // RESTO: UGUALE A PRIMA
  // ======================

  private getTitle(): string {
    return (this.contenuto?.titolo ?? this.content?.title ?? '').trim();
  }

  private setupWhereText() {
    this.whereText = this.kind === 'GAME' ? 'Disponibile su' : 'Guarda ora';
  }

  private loadSeriesStatsFromApi() {
    this.seriesSeasons = 0;
    this.seriesEpisodes = 0;
    this.seriesStatsLoading = false;

    if (this.kind !== 'SERIES') return;

    const title = this.getTitle();
    if (!title) return;

    this.seriesStatsLoading = true;

    this.tmdb.getTvStatsIT(title).pipe(
      timeout(10000),
      catchError(() => of({ seasons: 0, episodes: 0 })),
      finalize(() => {
        this.seriesStatsLoading = false;
        this.zone.run(() => this.cdr.markForCheck());
      })
    ).subscribe((stats: any) => {
      this.seriesSeasons = Number(stats?.seasons ?? 0);
      this.seriesEpisodes = Number(stats?.episodes ?? 0);
      this.zone.run(() => this.cdr.markForCheck());
    });
  }

  private loadPlatforms() {
    this.platformsLoading = true;
    this.platformsError = '';
    this.platforms = [];

    const title = this.getTitle();
    if (!title) {
      this.platformsLoading = false;
      this.platformsError = 'Titolo non disponibile.';
      return;
    }

    if (this.kind !== 'GAME') {
      this.tmdb.getWatchProvidersIT(this.kind, title).pipe(
        timeout(10000),
        catchError(() => {
          this.platformsError = 'Errore nel caricamento piattaforme.';
          return of([] as { label: string; url: string }[]);
        }),
        finalize(() => {
          this.platformsLoading = false;
          this.zone.run(() => this.cdr.markForCheck());
        })
      ).subscribe((list: any[]) => {
        const mapped = (list ?? [])
          .map(p => ({ label: this.shortPlatformLabel(p.label), url: p.url }))
          .filter(p => !!p.label && !!p.url);

        const seen = new Set<string>();
        this.platforms = mapped.filter(p => {
          const k = p.label.toUpperCase();
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });

        this.zone.run(() => this.cdr.markForCheck());
      });

      return;
    }

    const q = encodeURIComponent(title);
    this.platforms = [
      { label: 'PlayStation', url: `https://store.playstation.com/search/${q}` },
      { label: 'Xbox', url: `https://www.xbox.com/search?q=${q}` },
      { label: 'Steam', url: `https://store.steampowered.com/search/?term=${q}` },
    ];
    this.platformsLoading = false;
    this.zone.run(() => this.cdr.markForCheck());
  }

  private cleanTitleForSearch(title: string): string {
    return title
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?]/g, '')
      .replace(/[-:|].*$/g, (m) => m)
      .trim();
  }

  private loadTrailer() {
    this.trailerLoading = true;
    this.trailerError = '';
    this.trailerEmbed = undefined;
    this.trailerMp4Url = undefined;

    const title = this.contenuto?.titolo ?? this.content?.title ?? '';
    const year = this.contenuto?.annoPubblicazione ?? (this.content as any)?.year ?? undefined;

    if (!title.trim()) {
      this.trailerLoading = false;
      this.trailerError = 'Trailer non disponibile.';
      return;
    }

    if (this.kind === 'GAME') {
      const qTitle = this.cleanTitleForSearch ? this.cleanTitleForSearch(title) : title;

      this.rawg.getTrailerUrlByTitle(qTitle).pipe(
        timeout(10000),
        catchError(() => of(null)),
        finalize(() => { this.trailerLoading = false; })
      ).subscribe((url: string | null) => {
        if (!url) {
          this.trailerError = 'Trailer non disponibile.';
          return;
        }
        this.trailerMp4Url = url;
      });

      return;
    }

    const q = `${title} trailer`;

    this.api.getTrailerEmbed(this.kind, q, year).pipe(
      timeout(10000),
      catchError(() => of(null)),
      finalize(() => { this.trailerLoading = false; })
    ).subscribe((embedUrl: string | null) => {
      if (!embedUrl) {
        this.trailerError = 'Trailer non disponibile.';
        return;
      }

      if (!embedUrl.startsWith('https://') && !embedUrl.startsWith('http://')) {
        this.trailerError = 'Trailer non disponibile.';
        return;
      }

      this.trailerEmbed = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    });
  }

  displayScore(): number | null {
    const raw =
      this.contenuto?.mediaVoti !== undefined
        ? Number(this.contenuto.mediaVoti ?? 0)
        : Number((this.content as any)?.rating ?? NaN);

    if (!Number.isFinite(raw)) return null;

    const clamped = Math.max(1, Math.min(10, raw));
    return Math.round(clamped * 10) / 10;
  }

  private loadFromMock() {
    this.loading = true;
    this.error = '';

    const found = findMockContent(this.kind as MockKind, this.id);
    if (!found) {
      this.content = null;
      this.error = 'Contenuto non trovato.';
      this.loading = false;
      return;
    }

    this.content = found;

    this.setupWhereText();
    this.loadPlatforms();
    this.loadSeriesStatsFromApi();
    this.loadTrailer();
    this.loadReviewsFromApi();

    this.loading = false;
  }

  onToggle(section: Exclude<OpenSection, null>, ev: Event) {
    const details = ev.target as HTMLDetailsElement;
    if (details.open) this.openSection = section;
    else if (this.openSection === section) this.openSection = null;
  }

  roundedRating(rating: number): number {
    return Math.round(rating);
  }

  private formatDateDDMMYYYY(d: Date) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  }

  private shortPlatformLabel(name: string): string {
    const n = (name || '').toLowerCase();

    if (n.includes('netflix')) return 'Netflix';
    if (n.includes('hbo')) return 'HBO Max';
    if (n.includes('disney')) return 'Disney+';
    if (n.includes('prime')) return 'Prime Video';
    if (n.includes('amazon')) return 'Prime Video';
    if (n.includes('apple')) return 'Apple TV+';
    if (n.includes('now')) return 'NOW';
    if (n.includes('paramount')) return 'Paramount+';

    return name
      .replace(/italy|channel|channels|subscription|subscriptions/gi, '')
      .trim()
      .slice(0, 16);
  }

  get reviewsSorted(): Review[] {
    // Ordina per id desc (se id cresce col tempo)
    return [...this.reviews].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }

  get reviewsToShow(): Review[] {
    const list = this.reviewsSorted;
    return this.showAllReviews ? list : list.slice(0, 5);
  }

  toggleReviews() {
    this.showAllReviews = !this.showAllReviews;
  }

}
