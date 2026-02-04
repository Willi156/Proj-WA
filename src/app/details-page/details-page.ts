import { ChangeDetectorRef, Component, Inject, NgZone, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { RawgService } from '../services/rawg.service';
import { ApiService } from '../services/api.service';
import { TmdbService } from '../services/tmdb.service';

import { switchMap, map } from 'rxjs/operators';
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
  // ======================
  // STATO PAGINA
  // ======================
  loading = true;
  error = '';

  kind: 'GAME' | 'MOVIE' | 'SERIES' = 'GAME';
  id = 0;

  whereText = '—';

  contenuto: IContenuto | null = null;
  content: MockContent | null = null;

  // ======================
  // ⭐ PREFERITI / AUTH
  // ======================
  isLoggedIn = false;
  isFavorite = false;
  private currentUserId: number | null = null;

  /** blocca click multipli mentre la richiesta è in corso */
  private favBusy = false;

  // ======================
  // RECENSIONI
  // ======================
  reviews: Review[] = [];
  reviewsLoading = false;
  reviewsError = '';
  reviewsPosting = false;
  reviewsPostError = '';

  readonly initialReviewsCount = 5;
  showAllReviews = false;
  openSection: OpenSection = 'list';

  // ======================
  // TRAILER
  // ======================
  trailerEmbed?: SafeResourceUrl;
  trailerMp4Url?: string;
  trailerLoading = false;
  trailerError = '';

  // ======================
  // PIATTAFORME
  // ======================
  platforms: { label: string; url: string }[] = [];
  platformsLoading = false;
  platformsError = '';

  // ======================
  // STATS SERIE (TMDB)
  // ======================
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

  // ======================
  // SCORE DISPLAY
  // ======================
  displayScore(): number | null {
    const raw =
      this.contenuto?.mediaVoti !== undefined
        ? Number(this.contenuto.mediaVoti ?? 0)
        : Number((this.content as any)?.rating ?? NaN);

    if (!Number.isFinite(raw)) return null;

    const clamped = Math.max(1, Math.min(10, raw));
    return Math.round(clamped * 10) / 10;
  }

  get score(): number {
    return this.displayScore() ?? 0;
  }

  get scoreClass(): string {
    const s = this.score;
    if (s >= 6.0) return 'ratingBadge score score-green';
    if (s >= 5.0) return 'ratingBadge score score-blue';
    if (s >= 4.0) return 'ratingBadge score score-yellow';
    if (s >= 1.0) return 'ratingBadge score score-orange';
    return 'ratingBadge score score-orange';
  }

  // ======================
  // INIT
  // ======================
  ngOnInit() {
    this.route.paramMap.subscribe((pm) => {
      const kindParam = (pm.get('kind') || 'GAME').toUpperCase();
      const idParam = pm.get('id') || '0';

      this.kind = (['GAME', 'MOVIE', 'SERIES'] as const).includes(kindParam as any)
        ? (kindParam as any)
        : 'GAME';

      this.id = Number(idParam) || 0;

      this.resetPageState();

      const navState = this.router.getCurrentNavigation()?.extras?.state as any;
      const passed =
        (navState?.contenuto as IContenuto) ??
        (this.isBrowser ? ((window.history.state?.contenuto as IContenuto) ?? null) : null);

      this.loadPage(passed);

      // ✅ ogni volta che entro (anche con refresh) ricontrollo auth + preferiti
      this.checkAuthAndFav();
    });
  }

  private resetPageState() {
    this.loading = true;
    this.error = '';

    this.whereText = '—';

    this.contenuto = null;
    this.content = null;

    // ⭐ reset
    this.isLoggedIn = false;
    this.isFavorite = false;
    this.currentUserId = null;
    this.favBusy = false;

    // reviews
    this.reviews = [];
    this.reviewsLoading = false;
    this.reviewsError = '';
    this.reviewsPosting = false;
    this.reviewsPostError = '';
    this.showAllReviews = false;
    this.openSection = 'list';

    // trailer
    this.trailerEmbed = undefined;
    this.trailerMp4Url = undefined;
    this.trailerLoading = false;
    this.trailerError = '';

    // platforms
    this.platforms = [];
    this.platformsLoading = false;
    this.platformsError = '';

    // stats serie
    this.seriesSeasons = 0;
    this.seriesEpisodes = 0;
    this.seriesStatsLoading = false;
  }

  private loadPage(passed: IContenuto | null) {
    if (passed) {
      this.contenuto = passed;
      this.content = null;

      this.setupWhereText();
      this.loadPlatforms();
      this.loadSeriesStatsFromApi();
      this.loadTrailer();
      this.loadReviewsFromApi();

      this.loading = false;
      this.error = '';
      this.zone.run(() => this.cdr.markForCheck());
      return;
    }

    this.loadFromMock();
  }

  // ======================
  // ⭐ AUTH + PREFERITI (BACKEND)
  // ======================

  /** id contenuto corrente */
  private getCurrentContentId(): number {
    return Number(this.id ?? 0);
  }

  /**
   * Estrae l'id contenuto dai preferiti:
   * - supporta array di numeri: [107, 5, 170]
   * - supporta array di oggetti: [{idContenuto: 107}, ...]
   */
  private extractFavId(x: any): number {
    if (typeof x === 'number') return x;
    if (typeof x === 'string' && x.trim() !== '') return Number(x);

    return (
      Number(x?.idContenuto ?? 0) ||
      Number(x?.contenutoId ?? 0) ||
      Number(x?.id ?? 0) ||
      0
    );
  }

  /** Rilegge la lista preferiti dal backend e aggiorna isFavorite */
  private refreshFavoritesFromBackend(uid: number) {
    const cid = this.getCurrentContentId();

    console.log('[FAV] refreshFavoritesFromBackend...', { uid, cid });

    this.api.getFavouritesMediaByUserId(uid).pipe(
      timeout(8000),
      catchError((err) => {
        console.error('[FAV] errore GET preferiti', err);
        return of([] as any[]);
      })
    ).subscribe((list: any[]) => {
      // normalizzo in lista di numeri
      const ids = (list ?? [])
        .map((x: any) => this.extractFavId(x))
        .filter((n: number) => Number.isFinite(n) && n > 0);

      console.log('[FAV] lista backend (ids):', ids);

      const inDb = ids.includes(cid);
      console.log('[FAV] presente nel backend?', inDb);

      this.isFavorite = inDb;

      this.zone.run(() => this.cdr.markForCheck());
    });
  }

  /** Controlla se loggato e poi aggiorna lo stato preferito dal backend */
  private checkAuthAndFav() {
    // reset visivo
    this.isLoggedIn = false;
    this.isFavorite = false;
    this.currentUserId = null;

    // 1) verifico autenticazione via /api/auth/me
    this.api.getCurrentUserInfo().pipe(
      timeout(8000),
      catchError((err) => {
        console.error('[AUTH] /me error', err);
        return of(null);
      })
    ).subscribe((me: any) => {
      const user = me?.user ?? me;
      const uid = Number(user?.id ?? 0);

      this.isLoggedIn = !!uid;
      this.currentUserId = uid || null;

      console.log('[AUTH] isLoggedIn?', this.isLoggedIn, 'uid:', this.currentUserId);

      // 2) se non loggato, niente stella e stop
      if (!this.isLoggedIn || !this.currentUserId) {
        this.zone.run(() => this.cdr.markForCheck());
        return;
      }

      // 3) se loggato, scarico preferiti dal backend
      this.refreshFavoritesFromBackend(uid);
    });
  }

  /** Click sulla stella: aggiunge o rimuove dal backend e poi rilegge la lista */
  toggleFavorite() {
    const uid = this.currentUserId;
    const cid = this.getCurrentContentId();

    console.log('[STAR] toggleFavorite()', {
      isLoggedIn: this.isLoggedIn,
      isFavorite: this.isFavorite,
      uid,
      cid,
      busy: this.favBusy
    });

    // se non loggato o richiesta già in corso -> stop
    if (!this.isLoggedIn || !uid || !cid || this.favBusy) return;

    this.favBusy = true;

    // Se è preferito => REMOVE
    // Se è preferito => REMOVE
    if (this.isFavorite) {
      console.log('[STAR] REMOVE preferito', { uid, contenutoId: cid });

      // ✅ optimistic update: aggiorno subito la UI
      this.isFavorite = false;
      this.zone.run(() => this.cdr.markForCheck());

      this.api.removeMediaFromFavourites(uid, cid).pipe(
        timeout(8000),
        catchError((err) => {
          console.error('[STAR] remove error', err);

          // ❗ rollback: se fallisce, rimetto la stella piena
          this.isFavorite = true;
          this.zone.run(() => this.cdr.markForCheck());

          return of(null);
        }),
        finalize(() => {
          this.favBusy = false;
        })
      ).subscribe(() => {
        // rileggo dal backend per riallineare stato reale
        this.refreshFavoritesFromBackend(uid);
      });

      return;
    }


    // Se non è preferito => ADD
    console.log('[STAR] ADD preferito', { uid, contenutoId: cid });

    this.api.addMediaToFavourites(uid, cid).pipe(
      timeout(8000),
      catchError((err) => {
        console.error('[STAR] add error', err);
        return of(null);
      }),
      finalize(() => {
        this.favBusy = false;
      })
    ).subscribe((res) => {
      console.log('[STAR] add response', res);
      this.refreshFavoritesFromBackend(uid);
    });
  }

  // ======================
  // REVIEWS
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
      this.reviews = (list ?? []).map((r) => this.mapReviewFromDb(r));
      this.reviews = [...this.reviews].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
      this.zone.run(() => this.cdr.markForCheck());
    });
  }

  private mapReviewFromDb(r: any): Review {
    return {
      id: Number(r?.id ?? 0),
      idUtente: Number(r?.idUtente ?? 0),
      idContenuto: Number(r?.idContenuto ?? 0),
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

    this.api.me().pipe(
      timeout(10000),
      map((res: any) => Number(res?.user?.id ?? res?.id ?? 0)),
      switchMap((userId) => {
        if (!userId) throw new Error('User non autenticato o id mancante.');
        return this.api.addRecensione(contenutoId, userId, voto, commento, titolo, new Date());
      }),
      catchError((err) => {
        console.error('submitReview error', err);
        this.reviewsPostError = 'Errore durante la pubblicazione.';
        return of(null);
      }),
      finalize(() => {
        this.reviewsPosting = false;
        this.zone.run(() => this.cdr.markForCheck());
      })
    ).subscribe((saved) => {
      if (!saved) return;
      this.resetDraft();
      this.openSection = 'list';
      this.loadReviewsFromApi();
    });
  }

  resetDraft() {
    this.reviewDraft = { title: '', rating: 0, comment: '' };
  }

  setRating(n: number) {
    this.reviewDraft.rating = n;
  }

  // ======================
  // HELPERS CONTENUTO
  // ======================
  private getTitle(): string {
    return (this.contenuto?.titolo ?? this.content?.title ?? '').trim();
  }

  private setupWhereText() {
    this.whereText = this.kind === 'GAME' ? 'Disponibile su' : 'Guarda ora';
  }

  private cleanTitleForTmdb(title: string): string {
    return (title || '')
      .trim()
      .replace(/\s+-\s+/g, ': ')
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?]/g, '')
      .trim();
  }

  // ======================
  // STATS SERIE (TMDB)
  // ======================
  private loadSeriesStatsFromApi() {
    this.seriesSeasons = 0;
    this.seriesEpisodes = 0;
    this.seriesStatsLoading = false;

    if (this.kind !== 'SERIES') return;

    const rawTitle = this.getTitle();
    if (!rawTitle) return;

    const title = this.cleanTitleForTmdb(rawTitle);

    this.seriesStatsLoading = true;

    this.tmdb.getTvStatsSmart(title).pipe(
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

  // ======================
  // PIATTAFORME
  // ======================
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
        catchError(() => of([] as { label: string; url: string }[])),
        finalize(() => {
          this.platformsLoading = false;
          this.zone.run(() => this.cdr.markForCheck());
        })
      ).subscribe((list: any[]) => {
        const mapped = (list ?? [])
          .map((p) => ({ label: this.shortPlatformLabel(p.label), url: p.url }))
          .filter((p) => !!p.label && !!p.url);

        const seen = new Set<string>();
        this.platforms = mapped.filter((p) => {
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

  // ======================
  // TRAILER
  // ======================
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
      const qTitle = this.cleanTitleForSearch(title);

      this.rawg.getTrailerSmartByTitle(qTitle).pipe(
        timeout(10000),
        catchError(() => of({ source: 'RAWG', kind: 'MP4', url: null } as const)),
        finalize(() => {
          this.trailerLoading = false;
          this.zone.run(() => this.cdr.markForCheck());
        })
      ).subscribe((pick: any) => {
        this.trailerMp4Url = undefined;
        this.trailerEmbed = undefined;

        if (!pick.url) {
          this.trailerError = 'Trailer non disponibile.';
          return;
        }

        if (pick.kind === 'MP4') {
          this.trailerMp4Url = pick.url;
          return;
        }

        this.trailerEmbed = this.sanitizer.bypassSecurityTrustResourceUrl(pick.url);
      });

      return;
    }

    const qTitle = this.cleanTitleForSearch(title);

    this.tmdb.getTrailerEmbedSmart(this.kind, qTitle, year).pipe(
      timeout(10000),
      catchError(() => of(null)),
      finalize(() => {
        this.trailerLoading = false;
        this.zone.run(() => this.cdr.markForCheck());
      })
    ).subscribe((embedUrl: string | null) => {
      if (!embedUrl) {
        this.trailerError = 'Trailer non disponibile.';
        return;
      }
      this.trailerEmbed = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    });
  }

  // ======================
  // MOCK
  // ======================
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
    this.zone.run(() => this.cdr.markForCheck());
  }

  // ======================
  // UI HELPERS
  // ======================
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
}
