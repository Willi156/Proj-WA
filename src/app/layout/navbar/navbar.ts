import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { catchError, filter, of, take } from 'rxjs';

type SearchType = 'GAME' | 'MOVIE' | 'SERIES';

type SearchItem = {
  id: number;
  title: string;
  type: SearchType;
  thumbUrl: string;
  score: number;
  raw: any;
};

type SearchGroup = {
  type: SearchType;
  label: string;
  items: SearchItem[];
};

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent {
  isMenuOpen = false;
  isSearchOpen = false;
  mobileOpen: 'games' | 'movies' | 'series' | null = null;

  searchQuery = '';
  isLoggedIn = false;

  // ✅ true quando sei nella pagina signin/signup
  isAuthPage = false;

  @ViewChild('overlaySearchInput')
  overlaySearchInput!: ElementRef<HTMLInputElement>;

  private searchData: SearchItem[] = [];

  constructor(private router: Router, private api: ApiService) {
    this.loadSearchData();

    // ✅ inizializza anche in caso di refresh diretto su /login
    this.updateAuthPageFromUrl(this.router.url);
    this.refreshAuthState();

    // ✅ aggiorna tutto a ogni cambio route (login/logout/redirect)
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        const nav = e as NavigationEnd;
        const url = nav.urlAfterRedirects || nav.url;

        this.updateAuthPageFromUrl(url);
        this.refreshAuthState();

        // se navighi, chiudi menu/overlay aperti (evita overlay "bloccati")
        this.closeMenu();
        this.closeSearch();
      });
  }

  /** ================= AUTH ================= */
  refreshAuthState() {
    this.api
      .me()
      .pipe(
        take(1),
        catchError(() => of(null))
      )
      .subscribe((res) => {
        this.isLoggedIn = !!res;
      });
  }

  private updateAuthPageFromUrl(url: string) {
    const clean = (url || '').split('?')[0].split('#')[0];
    this.isAuthPage = clean.startsWith('/login');
  }

  /** ================= NAV ================= */
  goTo(route: string) {
    this.closeSearch();
    this.closeMenu();
    this.router.navigateByUrl(route);
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) this.isSearchOpen = false;
  }

  closeMenu() {
    this.isMenuOpen = false;
    this.mobileOpen = null;
  }

  toggleMobileSection(section: 'games' | 'movies' | 'series') {
    this.mobileOpen = this.mobileOpen === section ? null : section;
  }

  /** ================= SEARCH ================= */
  openSearch() {
    // ✅ se sei su pagina login, non aprire search (coerente con “non mostrare nulla”)
    if (this.isAuthPage) return;

    this.isSearchOpen = true;
    this.isMenuOpen = false;
    this.searchQuery = '';

    // ✅ focus input quando la modale è renderizzata
    setTimeout(() => {
      this.overlaySearchInput?.nativeElement?.focus();
    }, 0);
  }

  closeSearch() {
    this.isSearchOpen = false;
  }

  openDetailsFromSearch(item: SearchItem) {
    this.closeSearch();
    this.closeMenu();

    this.router.navigate(['/details', item.type, item.id], {
      state: { contenuto: item.raw },
    });
  }

  private loadSearchData() {
    this.api
      .getContenuti()
      .pipe(catchError(() => of([])))
      .subscribe((res: any) => {
        const all: any[] = Array.isArray(res) ? res : res?.data ?? res?.content ?? res?.results ?? [];
        this.searchData = all
          .map((x: any) => this.toSearchItem(x))
          .filter((x: any) => !!x && !!x.id && !!x.title);
      });
  }

  private normalizeImageUrl(raw: any): string {
    if (!raw || typeof raw !== 'string') return '';
    let url = raw.trim();
    if (url.startsWith('http://')) url = 'https://' + url.slice('http://'.length);
    return url;
  }

  private detectType(src: any): SearchType {
    const t = String(src?.tipo ?? src?.kind ?? src?.category ?? '')
      .toUpperCase()
      .trim();

    if (t.includes('GIOCO') || t.includes('GAME')) return 'GAME';
    if (t.includes('SERIE')) return 'SERIES';
    if (t.includes('FILM') || t.includes('MOVIE')) return 'MOVIE';

    return 'MOVIE';
  }

  private toSearchItem(src: any): SearchItem {
    const id = Number(src?.id ?? 0);
    const title = String(src?.titolo ?? src?.title ?? src?.name ?? '').trim();
    const type = this.detectType(src);

    const thumbUrl = this.normalizeImageUrl(
      src?.imageLink ?? src?.coverUrl ?? src?.imageUrl ?? src?.cover ?? ''
    );

    const rawScore = Number(src?.mediaVoti ?? src?.rating ?? 0);
    const score = Math.max(0, Math.min(10, rawScore));

    return { id, title, type, thumbUrl, score, raw: src };
  }

  private normalize(s: string) {
    return (s || '').trim().toLowerCase();
  }

  get groupedResults(): SearchGroup[] {
    const q = this.normalize(this.searchQuery);
    if (!q) return [];

    const results = this.searchData
      .filter((x) => this.normalize(x.title).includes(q))
      .slice(0, 18);

    const groups: Record<SearchType, SearchItem[]> = { GAME: [], MOVIE: [], SERIES: [] };
    for (const item of results) groups[item.type].push(item);

    const out: SearchGroup[] = [];
    if (groups.GAME.length) out.push({ type: 'GAME', label: 'Games', items: groups.GAME });
    if (groups.MOVIE.length) out.push({ type: 'MOVIE', label: 'Movies', items: groups.MOVIE });
    if (groups.SERIES.length) out.push({ type: 'SERIES', label: 'TV Shows', items: groups.SERIES });

    return out;
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.isSearchOpen) this.closeSearch();
    if (this.isMenuOpen) this.closeMenu();
  }
}
