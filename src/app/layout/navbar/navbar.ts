import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { catchError, of } from 'rxjs';

type SearchType = 'GAME' | 'MOVIE' | 'SERIES';

type SearchItem = {
  id: number;
  title: string;
  type: SearchType;
  thumbUrl: string;
  score: number;

  // oggetto originale del DB: ci serve per passarlo alla pagina dettagli via state
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
  /** Menu hamburger mobile aperto/chiuso */
  isMenuOpen = false;

  /** Overlay ricerca aperto/chiuso */
  isSearchOpen = false;

  /** Sezione aperta nel menu mobile (accordion) */
  mobileOpen: 'games' | 'movies' | 'series' | null = null;

  /** Testo digitato nella search */
  searchQuery = '';

  /** Input nell’overlay (per fare focus automatico) */
  @ViewChild('overlaySearchInput')
  overlaySearchInput!: ElementRef<HTMLInputElement>;

  /** Cache locale di TUTTI i contenuti dal DB, normalizzati in SearchItem */
  private searchData: SearchItem[] = [];

  constructor(private router: Router, private api: ApiService) {
    // ✅ Carico TUTTI i contenuti dal DB (non solo quelli della home)
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

        // Normalizzo tutto in SearchItem
        this.searchData = all
          .map((x) => this.toSearchItem(x))
          .filter((x) => !!x && !!x.id && !!x.title);
      });
  }

  /** Apre/chiude hamburger menu */
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) this.isSearchOpen = false;
  }

  /** Chiude hamburger menu */
  closeMenu() {
    this.isMenuOpen = false;
    this.mobileOpen = null;
  }

  /** Apre/chiude una sezione (accordion) del menu mobile */
  toggleMobileSection(section: 'games' | 'movies' | 'series') {
    this.mobileOpen = this.mobileOpen === section ? null : section;
  }

  /** Apre overlay di ricerca e fa focus sull’input */
  openSearch() {
    this.isSearchOpen = true;
    this.isMenuOpen = false;
    this.searchQuery = '';

    setTimeout(() => {
      this.overlaySearchInput?.nativeElement.focus();
    }, 0);
  }

  /** Chiude overlay di ricerca */
  closeSearch() {
    this.isSearchOpen = false;
  }

  /** Navigazione generica (link statici) */
  goTo(route: string) {
    this.closeSearch();
    this.closeMenu();
    this.router.navigateByUrl(route);
  }

  /** Click su un risultato: apre pagina dettagli come fa la dashboard */
  openDetailsFromSearch(item: SearchItem) {
    this.closeSearch();
    this.closeMenu();

    // ✅ IMPORTANTISSIMO: passiamo l’oggetto contenuto (raw) nello state
    // così details-page lo trova in history.state e non dipende dal mock.
    this.router.navigate(['/details', item.type, item.id], {
      state: { contenuto: item.raw },
    });
  }

  /** Normalizza stringhe per confronti */
  private normalize(s: string) {
    return (s || '').trim().toLowerCase();
  }

  /** Supporta [] oppure {data:[...]} ecc. (robusto) */
  private extractArray(res: any): any[] {
    if (Array.isArray(res)) return res;
    return res?.data ?? res?.content ?? res?.results ?? res?.result ?? [];
  }

  /** Normalizza URL immagine */
  private normalizeImageUrl(raw: any): string {
    if (!raw || typeof raw !== 'string') return '';
    let url = raw.trim();
    if (url.startsWith('http://')) url = 'https://' + url.slice('http://'.length);
    return url;
  }

  /** Deduce il tipo (GAME/MOVIE/SERIES) dal campo tipo/kind (robusto) */
  private detectType(src: any): SearchType {
    const t = String(src?.tipo ?? src?.kind ?? src?.category ?? '')
      .toUpperCase()
      .trim();

    // prova varie forme possibili dal backend
    if (t.includes('GIOCO') || t.includes('GAME')) return 'GAME';
    if (t.includes('FILM') || t.includes('MOVIE')) return 'MOVIE';
    if (t.includes('SERIE')) return 'SERIES';

    // fallback: se non c’è tipo, prova a dedurre da campi tipici
    // (meglio di niente)
    return 'MOVIE';
  }

  /** Converte l’oggetto DB in SearchItem */
  private toSearchItem(src: any): SearchItem {
    const id = Number(src?.id ?? 0);
    const title = String(src?.titolo ?? src?.title ?? src?.name ?? 'Senza titolo').trim();

    const type = this.detectType(src);

    const thumbUrl = this.normalizeImageUrl(
      src?.imageLink ?? src?.coverUrl ?? src?.imageUrl ?? src?.cover ?? ''
    );

    // score (se non esiste, resta 0)
    const rawScore = Number(src?.mediaVoti ?? src?.rating ?? 0);
    const score = Math.max(0, Math.min(10, rawScore));

    return {
      id,
      title,
      type,
      thumbUrl,
      score,
      raw: src,
    };
  }

  /** Risultati raggruppati per tipo (Games / Movies / TV Shows) */
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

  /** Chiude overlay/menu con ESC */
  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.isSearchOpen) this.closeSearch();
    if (this.isMenuOpen) this.closeMenu();
  }
}
