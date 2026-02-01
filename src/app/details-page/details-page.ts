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

/**
 * Modello recensione come arriva dal backend (mappata in UI)
 */
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
  // Stato pagina
  loading = true;
  error = '';

  // Tipo contenuto e id (da route)
  kind: 'GAME' | 'MOVIE' | 'SERIES' = 'GAME';
  id = 0;

  // Testo label "where to watch/buy"
  whereText = '—';

  // Dati contenuto: o DB (contenuto) o mock (content)
  contenuto: IContenuto | null = null;
  content: MockContent | null = null;

  // ======================
  // RECENSIONI
  // ======================
  reviews: Review[] = [];
  reviewsLoading = false;
  reviewsError = '';
  reviewsPosting = false;
  reviewsPostError = '';

  // UI: prime 5 + toggle
  readonly initialReviewsCount = 5;
  showAllReviews = false;

  // Accordion aperto di default: recensioni
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

  // stelle UI (1..10)
  stars = Array.from({ length: 10 });

  // draft recensione (form)
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
    // serve per evitare window/history in SSR
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * ✅ FIX PRINCIPALE:
   * In Angular, quando navighi su "stessa pagina" (Details) cambiando solo params (kind/id),
   * il componente può essere RIUSATO => ngOnInit non si rilancia con snapshot.
   *
   * Qui ascoltiamo i parametri e ricarichiamo SEMPRE i dati quando cambiano.
   */
  ngOnInit() {
    this.route.paramMap.subscribe((pm) => {
      const kindParam = (pm.get('kind') || 'GAME').toUpperCase();
      const idParam = pm.get('id') || '0';

      this.kind = (['GAME', 'MOVIE', 'SERIES'] as const).includes(kindParam as any)
        ? (kindParam as any)
        : 'GAME';

      this.id = Number(idParam) || 0;

      // reset completo della pagina (evita che restino dati vecchi)
      this.resetPageState();

      // prendo eventuale contenuto passato via navigation state (se c'è)
      const navState = this.router.getCurrentNavigation()?.extras?.state as any;
      const passed =
        (navState?.contenuto as IContenuto) ??
        (this.isBrowser ? ((window.history.state?.contenuto as IContenuto) ?? null) : null);

      // carico tutto
      this.loadPage(passed);
    });
  }

  /**
   * Resetta tutti gli stati/dati quando cambia contenuto (navigazione details->details).
   * Così non rimangono badge/recensioni/trailer vecchi in UI.
   */
  private resetPageState() {
    this.loading = true;
    this.error = '';

    this.whereText = '—';

    this.contenuto = null;
    this.content = null;

    // reviews
    this.reviews = [];
    this.reviewsLoading = false;
    this.reviewsError = '';
    this.reviewsPosting = false;
    this.reviewsPostError = '';
    this.showAllReviews = false;

    // se vuoi, quando cambi contenuto riapro sempre la lista
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

  /**
   * Carica la pagina:
   * - se "passed" esiste => uso quello (contenuto DB passato da search/dashboard)
   * - altrimenti => mock fallback (come facevi già)
   */
  private loadPage(passed: IContenuto | null) {
    // Se ho un contenuto dal DB passato dalla pagina precedente
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

    // fallback: dati mock
    this.loadFromMock();
  }

  // ======================
  // SCORE BADGE (COLORS)
  // ======================

  /**
   * Restituisce lo score usato dal badge (numero tra 1 e 10, o 0 se nullo)
   * Serve per calcolare la classe colore.
   */
  get score(): number {
    return this.displayScore() ?? 0;
  }

  /**
   * Logica colore badge:
   * - >= 6 green
   * - >= 5 blue
   * - >= 4 yellow
   * - >= 1 orange
   */
  get scoreClass(): string {
    const s = this.score;
    if (s >= 6.0) return 'ratingBadge score score-green';
    if (s >= 5.0) return 'ratingBadge score score-blue';
    if (s >= 4.0) return 'ratingBadge score score-yellow';
    if (s >= 1.0) return 'ratingBadge score score-orange';
    return 'ratingBadge score score-orange';
  }

  // ======================
  // REVIEWS: PRIME 5 + TOGGLE
  // ======================

  /**
   * Restituisce le recensioni visibili:
   * - se showAllReviews=true => tutte
   * - altrimenti => prime 5
   */
  get visibleReviews(): Review[] {
    if (this.showAllReviews) return this.reviews;
    return this.reviews.slice(0, this.initialReviewsCount);
  }

  /**
   * True se ci sono più di 5 recensioni (mostra il bottone toggle)
   */
  get hasMoreReviews(): boolean {
    return this.reviews.length > this.initialReviewsCount;
  }

  /**
   * Toggle mostra altre / mostra meno recensioni
   */
  toggleMoreReviews() {
    this.showAllReviews = !this.showAllReviews;
  }

  // ======================
  // LOAD REVIEWS DAL DB
  // ======================

  /**
   * Carica le recensioni dal backend per contenutoId = this.id
   * - gestisce loading/error
   * - mappa il formato DB in formato UI
   * - ordina newest-first (id desc)
   */
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
      // DEBUG utile: vedere raw
      if (list && list.length > 0) console.log('RECENSIONE RAW (prima):', list[0]);

      this.reviews = (list ?? []).map((r) => this.mapReviewFromDb(r));

      // newest first
      this.reviews = [...this.reviews].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

      this.zone.run(() => this.cdr.markForCheck());
    });
  }

  /**
   * Converte un oggetto recensione del DB (titolo/testo/voto/data/username/immagineProfilo)
   * in un oggetto Review usabile dalla UI.
   */
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

  /**
   * Normalizza la data:
   * - se già DD/MM/YYYY => ritorna com'è
   * - se ISO => converte in DD/MM/YYYY
   */
  private normalizeDate(v: any): string {
    if (typeof v === 'string' && v.includes('/')) return v;

    if (typeof v === 'string' && v.includes('-')) {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return this.formatDateDDMMYYYY(d);
    }

    const d = v ? new Date(v) : new Date();
    return this.formatDateDDMMYYYY(d);
  }

  /**
   * Invia una nuova recensione:
   * - valida i campi
   * - prende userId da /me
   * - invia recensione
   * - ricarica la lista dal DB
   */
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

      // estraggo l'id utente
      map((res: any) => Number(res?.id ?? 0)),

      // se userId valido => invio recensione
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

  /**
   * Resetta il form della recensione
   */
  resetDraft() {
    this.reviewDraft = { title: '', rating: 0, comment: '' };
  }

  /**
   * Imposta il voto scelto (1..10)
   */
  setRating(n: number) {
    this.reviewDraft.rating = n;
  }

  // ======================
  // HELPERS CONTENUTO
  // ======================

  /**
   * Ritorna il titolo del contenuto (DB o mock), senza spazi inutili
   */
  private getTitle(): string {
    return (this.contenuto?.titolo ?? this.content?.title ?? '').trim();
  }

  /**
   * Imposta la label "Disponibile su" (giochi) / "Guarda ora" (film/serie)
   */
  private setupWhereText() {
    this.whereText = this.kind === 'GAME' ? 'Disponibile su' : 'Guarda ora';
  }

  /**
   * Normalizza titolo per TMDB (gestisce casi tipo " - " trasformandolo in ": ")
   */
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

  /**
   * Carica number_of_seasons e number_of_episodes da TMDB.
   * Se kind !== SERIES esce.
   */
  private loadSeriesStatsFromApi() {
    this.seriesSeasons = 0;
    this.seriesEpisodes = 0;
    this.seriesStatsLoading = false;

    if (this.kind !== 'SERIES') return;

    const rawTitle = this.getTitle();
    if (!rawTitle) return;

    const title = this.cleanTitleForTmdb(rawTitle);

    this.seriesStatsLoading = true;

    console.log('[TMDB STATS] rawTitle:', rawTitle);
    console.log('[TMDB STATS] cleanedTitle:', title);

    this.tmdb.getTvStatsSmart(title).pipe(
      timeout(10000),
      catchError((err) => {
        console.error('[TMDB STATS] error:', err);
        return of({ seasons: 0, episodes: 0 });
      }),
      finalize(() => {
        this.seriesStatsLoading = false;
        this.zone.run(() => this.cdr.markForCheck());
      })
    ).subscribe((stats: any) => {
      console.log('[TMDB STATS] result:', stats);

      this.seriesSeasons = Number(stats?.seasons ?? 0);
      this.seriesEpisodes = Number(stats?.episodes ?? 0);

      this.zone.run(() => this.cdr.markForCheck());
    });
  }

  // ======================
  // PIATTAFORME
  // ======================

  /**
   * Carica piattaforme:
   * - per film/serie usa TMDB watch providers
   * - per giochi usa link diretti a store (Steam/Xbox/PlayStation)
   */
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

    // MOVIE / SERIES => TMDB
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
          .map((p) => ({ label: this.shortPlatformLabel(p.label), url: p.url }))
          .filter((p) => !!p.label && !!p.url);

        // dedup provider
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

    // GAME => link store
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

  /**
   * Pulisce il titolo per la ricerca trailer (rimuove parentesi/quadre)
   */
  private cleanTitleForSearch(title: string): string {
    return title
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?]/g, '')
      .replace(/[-:|].*$/g, (m) => m)
      .trim();
  }

  /**
   * Carica trailer:
   * - GAME: RAWG mp4 url
   * - MOVIE/SERIES: endpoint embedUrl backend (YouTube embed)
   */
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

    // GAME: RAWG
    if (this.kind === 'GAME') {
      const qTitle = this.cleanTitleForSearch(title);

      this.rawg.getTrailerUrlByTitle(qTitle).pipe(
        timeout(10000),
        catchError(() => of(null)),
        finalize(() => {
          this.trailerLoading = false;
        })
      ).subscribe((url: string | null) => {
        if (!url) {
          this.trailerError = 'Trailer non disponibile.';
          return;
        }
        this.trailerMp4Url = url;
      });

      return;
    }

    // MOVIE/SERIES: backend embed
    const q = `${title} trailer`;

    this.api.getTrailerEmbed(this.kind, q, year).pipe(
      timeout(10000),
      catchError(() => of(null)),
      finalize(() => {
        this.trailerLoading = false;
      })
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

  // ======================
  // SCORE DISPLAY
  // ======================

  /**
   * Calcola lo score da mostrare nel badge (1..10) da:
   * - contenuto DB => mediaVoti
   * - contenuto mock => rating
   */
  displayScore(): number | null {
    const raw =
      this.contenuto?.mediaVoti !== undefined
        ? Number(this.contenuto.mediaVoti ?? 0)
        : Number((this.content as any)?.rating ?? NaN);

    if (!Number.isFinite(raw)) return null;

    const clamped = Math.max(1, Math.min(10, raw));
    return Math.round(clamped * 10) / 10;
  }

  // ======================
  // MOCK FALLBACK
  // ======================

  /**
   * Carica contenuto da mock (se non arriva dallo state router)
   * e avvia gli stessi caricamenti (platforms, stats, trailer, reviews)
   */
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

  /**
   * Gestisce apertura/chiusura dei dettagli (accordion)
   */
  onToggle(section: Exclude<OpenSection, null>, ev: Event) {
    const details = ev.target as HTMLDetailsElement;
    if (details.open) this.openSection = section;
    else if (this.openSection === section) this.openSection = null;
  }

  /**
   * Arrotonda il rating (stelle)
   */
  roundedRating(rating: number): number {
    return Math.round(rating);
  }

  /**
   * Converte Date => stringa DD/MM/YYYY
   */
  private formatDateDDMMYYYY(d: Date) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  }

  /**
   * Accorcia label provider (per bottone piattaforme)
   */
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
