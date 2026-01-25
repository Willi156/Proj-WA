import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { catchError, forkJoin, of } from 'rxjs';

type SearchType = 'GAME' | 'MOVIE' | 'SERIES';

type SearchItem = {
  title: string;
  type: SearchType;
  route: string;
  thumbUrl: string;
  score: number; 
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

  @ViewChild('overlaySearchInput')
  overlaySearchInput!: ElementRef<HTMLInputElement>;


  private searchData: SearchItem[] = [];

  constructor(private router: Router, private api: ApiService) {
  
    forkJoin({
      games: this.api.getGiochi().pipe(catchError(() => of([]))),
      movies: this.api.getFilm().pipe(catchError(() => of([]))),
      series: this.api.getSerieTv().pipe(catchError(() => of([]))),
    }).subscribe(({ games, movies, series }) => {
      const gArr = this.extractArray(games).slice(0, 15).map((x) => this.toSearchItem(x, 'GAME'));
      const mArr = this.extractArray(movies).slice(0, 15).map((x) => this.toSearchItem(x, 'MOVIE'));
      const sArr = this.extractArray(series).slice(0, 15).map((x) => this.toSearchItem(x, 'SERIES'));

      this.searchData = [...gArr, ...mArr, ...sArr];
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

  private normalize(s: string) {
    return s.trim().toLowerCase();
  }

  // supporta [] oppure {data:[...]} ecc.
  private extractArray(res: any): any[] {
    if (Array.isArray(res)) return res;
    return res?.data ?? res?.content ?? res?.results ?? res?.result ?? [];
  }

  // Normalizza URL immagine (uguale logica che usi in home)
  private normalizeImageUrl(raw: any): string {
    if (!raw || typeof raw !== 'string') return '';
    let url = raw.trim();
    if (url.startsWith('http://')) url = 'https://' + url.slice('http://'.length);
    return url;
  }

  // Converte l’oggetto DB in SearchItem
  private toSearchItem(src: any, type: SearchType): SearchItem {
    const id = src?.id ?? 0;
    const title = src?.titolo ?? src?.title ?? src?.name ?? 'Senza titolo';
    const thumbUrl = this.normalizeImageUrl(src?.imageLink ?? src?.coverUrl ?? src?.imageUrl ?? '');
    const score = Math.max(1, Math.min(10, Number(src?.mediaVoti ?? 0) + 2)); // ✅ il tuo boost +2 (1–10)

    // route base: se poi farai le pagine dettaglio, qui è già pronto
    const base =
      type === 'GAME' ? 'games' :
        type === 'MOVIE' ? 'movies' :
          'series';

    return {
      title,
      type,
      route: `/${base}/${id}`,
      thumbUrl,
      score,
    };
  }

  get groupedResults(): SearchGroup[] {
    const q = this.normalize(this.searchQuery);
    if (!q) return [];

    const results = this.searchData
      .filter((x) => this.normalize(x.title).includes(q))
      .slice(0, 12);

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
