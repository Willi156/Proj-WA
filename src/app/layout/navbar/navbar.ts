import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { catchError, of } from 'rxjs';
import { take } from 'rxjs/operators';

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

  @ViewChild('overlaySearchInput')
  overlaySearchInput!: ElementRef<HTMLInputElement>;

  private searchData: SearchItem[] = [];

  constructor(private router: Router, private api: ApiService) {
    // Carico contenuti per ricerca
    this.api
      .getContenuti()
      .pipe(
        catchError((err) => {
          console.error('[Navbar] getContenuti error', err);
          return of([] as any[]);
        })
      )
      .subscribe((res: any) => {
        const all = this.extractArray(res);
        this.searchData = all
          .map((x) => this.toSearchItem(x))
          .filter((x) => !!x && !!x.id && !!x.title);
      });

    // Stato auth iniziale
    this.refreshAuthState();
  }

  /** Ricalcola stato login (serve per nascondere Register) */
  private refreshAuthState() {
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

  openSearch() {
    this.isSearchOpen = true;
    this.isMenuOpen = false;
    this.searchQuery = '';

    setTimeout(() => {
      this.overlaySearchInput?.nativeElement.focus();
    }, 0);
  }

  closeSearch() {
    this.isSearchOpen = false;
  }

  goTo(route: string) {
    this.closeSearch();
    this.closeMenu();
    this.router.navigateByUrl(route);
  }

  openDetailsFromSearch(item: SearchItem) {
    this.closeSearch();
    this.closeMenu();

    this.router.navigate(['/details', item.type, item.id], {
      state: { contenuto: item.raw },
    });
  }

  private normalize(s: string) {
    return (s || '').trim().toLowerCase();
  }

  private extractArray(res: any): any[] {
    if (Array.isArray(res)) return res;
    return res?.data ?? res?.content ?? res?.results ?? res?.result ?? [];
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
    if (t.includes('FILM') || t.includes('MOVIE')) return 'MOVIE';
    if (t.includes('SERIE')) return 'SERIES';

    return 'MOVIE';
  }

  private toSearchItem(src: any): SearchItem {
    const id = Number(src?.id ?? 0);
    const title = String(src?.titolo ?? src?.title ?? src?.name ?? 'Senza titolo').trim();
    const type = this.detectType(src);

    const thumbUrl = this.normalizeImageUrl(
      src?.imageLink ?? src?.coverUrl ?? src?.imageUrl ?? src?.cover ?? ''
    );

    const rawScore = Number(src?.mediaVoti ?? src?.rating ?? 0);
    const score = Math.max(0, Math.min(10, rawScore));

    return { id, title, type, thumbUrl, score, raw: src };
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

  /** ✅ Click profilo: se loggato -> /user, altrimenti -> /login */
  onProfileClick() {
    this.closeSearch();
    this.closeMenu();

    this.api.me().pipe(take(1)).subscribe({
      next: () => {
        this.isLoggedIn = true;
        this.router.navigateByUrl('/user'); // ✅ QUESTA è la tua route corretta
      },
      error: () => {
        this.isLoggedIn = false;
        this.router.navigateByUrl('/login');
      },
    });
  }
}
