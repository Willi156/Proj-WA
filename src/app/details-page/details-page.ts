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

  // Tipo contenuto e id (da route)
  kind: 'GAME' | 'MOVIE' | 'SERIES' = 'GAME';
  id = 0;

  // Testo label "where to watch/buy"
  whereText = '—';

  // Dati contenuto: o DB (contenuto) o mock (content)
  contenuto: IContenuto | null = null;
  content: MockContent | null = null;

  // ======================
  // ⭐ PREFERITI / AUTH
  // ======================
  isLoggedIn = false;          // true se /api/auth/me restituisce utente
  isFavorite = false;          // true se contenuto presente nei preferiti
  private currentUserId: number | null = null;  // id utente loggato (se presente)

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
    // ✅ evita usare window/localStorage se SSR
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // ======================
  // SCORE DISPLAY
  // ======================
  displayScore(): number | null {
    // 1) se arriva dal DB: mediaVoti
    // 2) se arriva dai mock: rating
    const raw =
      this.contenuto?.mediaVoti !== undefined
        ? Number(this.contenuto.mediaVoti ?? 0)
        : Number((this.content as any)?.rating ?? NaN);

    // Se non è un numero valido -> non mostro nulla
    if (!Number.isFinite(raw)) return null;

    // Clamp 1..10 e arrotondo a 1 decimale
    const clamped = Math.max(1, Math.min(10, raw));
    return Math.round(clamped * 10) / 10;
  }

  get score(): number {
    // Score numerico usato dal badge (se null => 0)
    return this.displayScore() ?? 0;
  }

  get scoreClass(): string {
    // Calcolo classe colore badge basata sul punteggio
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
    // ✅ ascolto parametri route: se vai details->details cambia id/kind e ricarico tutto
    this.route.paramMap.subscribe((pm) => {
      // Leggo kind e id
      const kindParam = (pm.get('kind') || 'GAME').toUpperCase();
      const idParam = pm.get('id') || '0';

      // Normalizzo kind
      this.kind = (['GAME', 'MOVIE', 'SERIES'] as const).includes(kindParam as any)
        ? (kindParam as any)
        : 'GAME';

      // Normalizzo id
      this.id = Number(idParam) || 0;

      // Reset stati (evita glitch con dati vecchi)
      this.resetPageState();

      // Se arrivo dalla home/search passo già tutto il contenuto nello state
      const navState = this.router.getCurrentNavigation()?.extras?.state as any;
      const passed =
        (navState?.contenuto as IContenuto) ??
        (this.isBrowser ? ((window.history.state?.contenuto as IContenuto) ?? null) : null);

      // Carico contenuto + trailer + piattaforme + recensioni
      this.loadPage(passed);

      // ⭐ Ogni volta che cambia contenuto: ricalcolo auth + preferiti
      this.checkAuthAndFav();
    });
  }

  private resetPageState() {
    // Reset stato pagina
    this.loading = true;
    this.error = '';

    this.whereText = '—';

    // Reset contenuti
    this.contenuto = null;
    this.content = null;

    // ⭐ Reset auth/fav
    this.isLoggedIn = false;
    this.isFavorite = false;
    this.currentUserId = null;

    // Reset reviews
    this.reviews = [];
    this.reviewsLoading = false;
    this.reviewsError = '';
    this.reviewsPosting = false;
    this.reviewsPostError = '';
    this.showAllReviews = false;
    this.openSection = 'list';

    // Reset trailer
    this.trailerEmbed = undefined;
    this.trailerMp4Url = undefined;
    this.trailerLoading = false;
    this.trailerError = '';

    // Reset platforms
    this.platforms = [];
    this.platformsLoading = false;
    this.platformsError = '';

    // Reset stats serie
    this.seriesSeasons = 0;
    this.seriesEpisodes = 0;
    this.seriesStatsLoading = false;
  }

  private loadPage(passed: IContenuto | null) {
    // Se ho un contenuto del DB passato dallo state, lo uso subito
    if (passed) {
      this.contenuto = passed;
      this.content = null;

      // Set label "where"
      this.setupWhereText();

      // Caricamenti secondari
      this.loadPlatforms();
      this.loadSeriesStatsFromApi();
      this.loadTrailer();
      this.loadReviewsFromApi();

      // Fine loading
      this.loading = false;
      this.error = '';
      this.zone.run(() => this.cdr.markForCheck());
      return;
    }

    // Altrimenti fallback ai mock
    this.loadFromMock();
  }

  // ======================
  // ⭐ AUTH + PREFERITI
  // ======================

  private getCurrentContentId(): number {
    // Id contenuto corrente (route param)
    return Number(this.id ?? 0);
  }

  private favLocalKey(uid: number): string {
    // ✅ fallback locale (solo finché manca endpoint ADD)
    // separo per utente e per tipo (GAME/MOVIE/SERIES) per evitare mix strani
    return `favLocal:${uid}:${this.kind}`;
  }

  private readLocalFavs(uid: number): Set<number> {
    // Legge da localStorage e ritorna set di contenutoId
    if (!this.isBrowser) return new Set<number>();

    try {
      const raw = localStorage.getItem(this.favLocalKey(uid));
      const arr = raw ? (JSON.parse(raw) as any[]) : [];
      return new Set(
        (arr ?? [])
          .map((n) => Number(n))
          .filter((n) => Number.isFinite(n) && n > 0)
      );
    } catch {
      return new Set<number>();
    }
  }

  private writeLocalFavs(uid: number, set: Set<number>) {
    // Scrive set in localStorage
    if (!this.isBrowser) return;
    localStorage.setItem(this.favLocalKey(uid), JSON.stringify(Array.from(set)));
  }

  private checkAuthAndFav() {
    // 1) Reset visivo iniziale (stella nascosta se non loggato)
    this.isLoggedIn = false;
    this.isFavorite = false;
    this.currentUserId = null;

    // 2) Chiamo /api/auth/me per capire se sono autenticato
    this.api.getCurrentUserInfo().pipe(
      timeout(8000),
      catchError(() => of(null))
    ).subscribe((me: any) => {
      // Backend può restituire {user:{...}} oppure direttamente {...}
      const user = me?.user ?? me;
      const uid = Number(user?.id ?? 0);

      // Se uid è valido, l'utente è loggato
      this.isLoggedIn = !!uid;
      this.currentUserId = uid || null;

      // Se NON loggato: stop, non mostro stella e non controllo preferiti
      if (!this.isLoggedIn || !this.currentUserId) {
        this.zone.run(() => this.cdr.markForCheck());
        return;
      }

      // 3) Se loggato: scarico preferiti dal backend (metodo già esistente)
      this.api.getFavouritesMediaByUserId(uid).pipe(
        timeout(8000),
        catchError(() => of([]))
      ).subscribe((list: any[]) => {
        const cid = this.getCurrentContentId();

        // Controllo se il contenuto è già nei preferiti DB
        const inDb = (list ?? []).some((x: any) => {
          // Robust: backend potrebbe chiamare il campo in modi diversi
          const favId =
            Number(x?.idContenuto ?? 0) ||
            Number(x?.contenutoId ?? 0) ||
            Number(x?.id ?? 0);

          return favId === cid;
        });

        // 4) Fallback: controllo anche localStorage (solo perché manca ADD nel backend)
        const local = this.readLocalFavs(uid).has(cid);

        // Se è in uno dei due: stella piena
        this.isFavorite = inDb || local;

        this.zone.run(() => this.cdr.markForCheck());
      });
    });
  }

  toggleFavorite() {
    // Se non loggato: non faccio nulla (la stella nemmeno dovrebbe esserci)
    if (!this.isLoggedIn || !this.currentUserId) return;

    const uid = this.currentUserId;
    const contenutoId = this.getCurrentContentId();
    if (!contenutoId) return;

    // CASO A) È GIÀ PREFERITO -> RIMUOVO
    if (this.isFavorite) {
      // Provo a rimuovere dal DB (endpoint esiste già)
      this.api.removeMediaFromFavourites(uid, contenutoId).pipe(
        timeout(8000),
        catchError(() => of(null))
      ).subscribe(() => {
        // In ogni caso tolgo anche dal localStorage (per coerenza)
        const s = this.readLocalFavs(uid);
        s.delete(contenutoId);
        this.writeLocalFavs(uid, s);

        // Aggiorno UI
        this.isFavorite = false;
        this.zone.run(() => this.cdr.markForCheck());
      });

      return;
    }

    // CASO B) NON È PREFERITO -> AGGIUNGO (fallback locale perché manca backend)
    // ✅ qui quando avrete endpoint ADD, sostituisci con chiamata API reale
    const s = this.readLocalFavs(uid);
    s.add(contenutoId);
    this.writeLocalFavs(uid, s);

    this.isFavorite = true;
    this.zone.run(() => this.cdr.markForCheck());
  }

  // ======================
  // REVIEWS
  // ======================
  get visibleReviews(): Review[] {
    // Se showAllReviews true -> tutte, altrimenti prime N
    if (this.showAllReviews) return this.reviews;
    return this.reviews.slice(0, this.initialReviewsCount);
  }

  get hasMoreReviews(): boolean {
    // true se il numero totale supera quelle iniziali
    return this.reviews.length > this.initialReviewsCount;
  }

  toggleMoreReviews() {
    // Toggle mostra più / mostra meno
    this.showAllReviews = !this.showAllReviews;
  }

  private loadReviewsFromApi() {
    // Inizio loading recensioni
    this.reviewsLoading = true;
    this.reviewsError = '';
    this.reviews = [];

    const contenutoId = Number(this.id);
    if (!contenutoId) {
      this.reviewsLoading = false;
      return;
    }

    // Chiamo endpoint recensioni per contenuto
    this.api.getRecensioniByContenutoId(contenutoId).pipe(
      timeout(10000),
      catchError((err) => {
        // Se errore: mostro messaggio e torno lista vuota
        console.error('getRecensioniByContenutoId error', err);
        this.reviewsError = 'Errore nel caricamento recensioni.';
        return of([] as any[]);
      }),
      finalize(() => {
        // Fine loading (sempre)
        this.reviewsLoading = false;
        this.zone.run(() => this.cdr.markForCheck());
      })
    ).subscribe((list: any[]) => {
      // Mappo dal formato DB al formato UI
      this.reviews = (list ?? []).map((r) => this.mapReviewFromDb(r));

      // Ordino newest-first
      this.reviews = [...this.reviews].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

      this.zone.run(() => this.cdr.markForCheck());
    });
  }

  private mapReviewFromDb(r: any): Review {
    // Converte una recensione DB in un oggetto Review per la UI
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
    // Se già DD/MM/YYYY la lascio com’è
    if (typeof v === 'string' && v.includes('/')) return v;

    // Se ISO -> converto in DD/MM/YYYY
    if (typeof v === 'string' && v.includes('-')) {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return this.formatDateDDMMYYYY(d);
    }

    // Fallback
    const d = v ? new Date(v) : new Date();
    return this.formatDateDDMMYYYY(d);
  }

  submitReview() {
    // Leggo e valido campi del form
    const titolo = (this.reviewDraft.title || '').trim();
    const commento = (this.reviewDraft.comment || '').trim();
    const voto = Number(this.reviewDraft.rating);

    if (!titolo || !commento || !(voto >= 1 && voto <= 10)) return;

    const contenutoId = Number(this.id);
    if (!contenutoId) return;

    // Stato UI: in invio
    this.reviewsPosting = true;
    this.reviewsPostError = '';

    // 1) chiedo userId al backend
    // 2) invio recensione
    // 3) ricarico recensioni
    this.api.me().pipe(
      timeout(10000),
      map((res: any) => Number(res?.user?.id ?? res?.id ?? 0)),
      switchMap((userId) => {
        if (!userId) throw new Error('User non autenticato o id mancante.');
        return this.api.addRecensione(contenutoId, userId, voto, commento, titolo, new Date());
      }),
      catchError((err) => {
        // Se errore: mostro messaggio
        console.error('submitReview error', err);
        this.reviewsPostError = 'Errore durante la pubblicazione.';
        return of(null);
      }),
      finalize(() => {
        // Fine invio (sempre)
        this.reviewsPosting = false;
        this.zone.run(() => this.cdr.markForCheck());
      })
    ).subscribe((saved) => {
      // Se salvata correttamente: reset e ricarico lista
      if (!saved) return;
      this.resetDraft();
      this.openSection = 'list';
      this.loadReviewsFromApi();
    });
  }

  resetDraft() {
    // Reset form recensione
    this.reviewDraft = { title: '', rating: 0, comment: '' };
  }

  setRating(n: number) {
    // Set voto in UI (1..10)
    this.reviewDraft.rating = n;
  }

  // ======================
  // HELPERS CONTENUTO
  // ======================
  private getTitle(): string {
    // Ritorna titolo del contenuto (DB o mock)
    return (this.contenuto?.titolo ?? this.content?.title ?? '').trim();
  }

  private setupWhereText() {
    // Imposta label box piattaforme
    this.whereText = this.kind === 'GAME' ? 'Disponibile su' : 'Guarda ora';
  }

  private cleanTitleForTmdb(title: string): string {
    // Normalizzazione semplice per migliorare match su TMDB
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
    // Reset valori
    this.seriesSeasons = 0;
    this.seriesEpisodes = 0;
    this.seriesStatsLoading = false;

    // Solo per le serie
    if (this.kind !== 'SERIES') return;

    const rawTitle = this.getTitle();
    if (!rawTitle) return;

    const title = this.cleanTitleForTmdb(rawTitle);

    // Stato UI: loading
    this.seriesStatsLoading = true;

    // Chiamo TMDB e salvo seasons/episodes
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
    // Reset stato
    this.platformsLoading = true;
    this.platformsError = '';
    this.platforms = [];

    const title = this.getTitle();
    if (!title) {
      this.platformsLoading = false;
      this.platformsError = 'Titolo non disponibile.';
      return;
    }

    // MOVIE / SERIES => TMDB providers
    if (this.kind !== 'GAME') {
      this.tmdb.getWatchProvidersIT(this.kind, title).pipe(
        timeout(10000),
        catchError(() => of([] as { label: string; url: string }[])),
        finalize(() => {
          this.platformsLoading = false;
          this.zone.run(() => this.cdr.markForCheck());
        })
      ).subscribe((list: any[]) => {
        // Mappo label corta + filtro null
        const mapped = (list ?? [])
          .map((p) => ({ label: this.shortPlatformLabel(p.label), url: p.url }))
          .filter((p) => !!p.label && !!p.url);

        // Dedup per label
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

    // GAME => link store “fissi”
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
    // Pulisce titolo per ricerche trailer
    return title
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?]/g, '')
      .replace(/[-:|].*$/g, (m) => m)
      .trim();
  }

  private loadTrailer() {
    // Reset trailer
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

    // GAME => RAWG mp4 / fallback embed
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

    // MOVIE/SERIES => TMDB embed
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
    // Carico contenuto mock se non arriva dal DB
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

    // Caricamenti secondari
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
    // Gestione accordion (details)
    const details = ev.target as HTMLDetailsElement;
    if (details.open) this.openSection = section;
    else if (this.openSection === section) this.openSection = null;
  }

  roundedRating(rating: number): number {
    // Arrotonda rating stelle recensione
    return Math.round(rating);
  }

  private formatDateDDMMYYYY(d: Date) {
    // Converte Date -> "DD/MM/YYYY"
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  }

  private shortPlatformLabel(name: string): string {
    // Accorcia nomi provider per i bottoni
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
