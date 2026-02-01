import { ChangeDetectorRef, Component, Inject, NgZone, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { RawgService } from '../services/rawg.service';
import { ApiService } from '../services/api.service';
import { TmdbService } from '../services/tmdb.service';

import { finalize, timeout, catchError, of } from 'rxjs';

import {
  MockContent,
  MockKind,
  MockReview,
  findMockContent,
} from '../mock/dati-mock-sample';

import { IContenuto } from '../features/home/pages/home-page/IContenuto';

type OpenSection = 'trailer' | 'write' | 'list' | null;

// ✅ tipo UI: aggiunge title opzionale senza toccare MockReview originale
type UIReview = MockReview & { title?: string };

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

  // ✅ ora reviews usa UIReview (con title?)
  reviews: UIReview[] = [];

  openSection: OpenSection = null;

  // Trailer
  trailerEmbed?: SafeResourceUrl;
  trailerMp4Url?: string;
  trailerLoading = false;
  trailerError = '';

  // Piattaforme
  platforms: { label: string; url: string }[] = [];
  platformsLoading = false;
  platformsError = '';

  // ✅ STATS SERIE (reali da TMDB)
  seriesSeasons = 0;
  seriesEpisodes = 0;
  seriesStatsLoading = false;

  stars = Array.from({ length: 10 });

  // ✅ ora abbiamo title separato
  reviewDraft: {
    title: string;
    rating: number;
    comment: string;
  } = {
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

    // ✅ SSR-safe
    const navState = this.router.getCurrentNavigation()?.extras?.state as any;
    const passed =
      (navState?.contenuto as IContenuto) ??
      (this.isBrowser ? ((window.history.state?.contenuto as IContenuto) ?? null) : null);

    if (passed) {
      this.contenuto = passed;

      this.content = null;
      this.reviews = [];

      this.setupWhereText();

      this.loadPlatforms();
      this.loadSeriesStatsFromApi();
      this.loadTrailer();

      this.loading = false;
      this.error = '';
      return;
    }

    this.loadFromMock();
  }

  private getTitle(): string {
    return (this.contenuto?.titolo ?? this.content?.title ?? '').trim();
  }

  private setupWhereText() {
    this.whereText = this.kind === 'GAME' ? 'Disponibile su' : 'Guarda ora';
  }

  // ✅ STATS SERIE REALI: number_of_seasons + number_of_episodes
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
    ).subscribe((stats) => {
      this.seriesSeasons = Number(stats?.seasons ?? 0);
      this.seriesEpisodes = Number(stats?.episodes ?? 0);
      this.zone.run(() => this.cdr.markForCheck());
    });
  }

  // ✅ PIATTAFORME
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
      ).subscribe((list) => {
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

    // Giochi: fallback
    const q = encodeURIComponent(title);
    this.platforms = [
      { label: 'PlayStation', url: `https://store.playstation.com/search/${q}` },
      { label: 'Xbox', url: `https://www.xbox.com/search?q=${q}` },
      { label: 'Steam', url: `https://store.steampowered.com/search/?term=${q}` },
    ];
    this.platformsLoading = false;

    this.zone.run(() => this.cdr.markForCheck());
  }

  // ---- TRAILER ----

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
    const year = this.contenuto?.annoPubblicazione ?? this.content?.year ?? undefined;

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

  private toOneDecimal(n: number): number {
    return Math.round(n * 10) / 10;
  }

  displayScore(): number | null {
    const raw =
      this.contenuto?.mediaVoti !== undefined
        ? Number(this.contenuto.mediaVoti ?? 0)
        : (this.content?.rating !== undefined ? Number(this.content.rating ?? 0) : NaN);

    if (!Number.isFinite(raw)) return null;

    const clamped = Math.max(1, Math.min(10, raw));
    return this.toOneDecimal(clamped);
  }

  private loadFromMock() {
    this.loading = true;
    this.error = '';

    const found = findMockContent(this.kind as MockKind, this.id);
    if (!found) {
      this.content = null;
      this.reviews = [];
      this.error = 'Contenuto non trovato.';
      this.loading = false;
      return;
    }

    this.content = found;

    // ✅ cast safe: mock reviews diventano UIReview (title opzionale)
    this.reviews = ([...found.reviews] as UIReview[]);

    this.setupWhereText();

    this.loadPlatforms();
    this.loadSeriesStatsFromApi();
    this.loadTrailer();

    this.loading = false;
  }

  onToggle(section: Exclude<OpenSection, null>, ev: Event) {
    const details = ev.target as HTMLDetailsElement;
    if (details.open) this.openSection = section;
    else if (this.openSection === section) this.openSection = null;
  }

  setRating(n: number) {
    this.reviewDraft.rating = n;
  }

  submitReview() {
    const title = this.reviewDraft.title.trim();
    const comment = this.reviewDraft.comment.trim();
    const rating = Number(this.reviewDraft.rating);

    if (!title || !comment || !(rating >= 1 && rating <= 10)) return;

    const today = this.formatDateDDMMYYYY(new Date());

    const newReview: UIReview = {
      user: 'Anonimo',
      title, // ✅ salvato
      rating,
      comment,
      date: today,
    };

    this.reviews = [newReview, ...this.reviews];

    if (this.content) {
      // ✅ aggiorniamo anche il mock in memoria (cast)
      (this.content.reviews as UIReview[]) = this.reviews;
    }

    this.resetDraft();
    this.openSection = 'list';
  }

  resetDraft() {
    this.reviewDraft = { title: '', rating: 0, comment: '' };
  }

  private formatDateDDMMYYYY(d: Date) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  }

  roundedRating(rating: number): number {
    return Math.round(rating);
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
