import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import { SerieTv } from '../../../model/serie-tv.model';
import { SerieTvCardComponent } from '../../serieTV-card/serieTV-card.component';

@Component({
  selector: 'app-series-released',
  standalone: true,
  imports: [CommonModule, FormsModule, SerieTvCardComponent],
  templateUrl: './series-released.component.html',
  styleUrls: ['../../../../games/components/style-pages.css'],
})
export class SeriesReleasedComponent implements OnInit {

  /* ===== SORT ===== */
  sortDirection: 'asc' | 'desc' = 'desc';
  sortValue: 'date' | 'score' = 'date';
  private sortValue$ = new BehaviorSubject<'date' | 'score'>('date');

  /* ===== YEAR FILTER ===== */
  minYear = 1980;
  maxYear = new Date().getFullYear();
  selectedYear!: number;
  defaultYear!: number;
  isYearFilterActive = false;
  isDraggingYear = false;

  /* ===== GENRES ===== */
  availableGenres: string[] = [];
  selectedGenres$ = new BehaviorSubject<Set<string>>(new Set());

  /* ===== DATA ===== */
  private allSeries$ = new BehaviorSubject<SerieTv[]>([]);
  currentPage$ = new BehaviorSubject<number>(1);

  itemsPerPage = 15;
  pages: number[] = [];

  series$!: Observable<SerieTv[]>;

  constructor(private api: ApiService) {

    this.series$ = combineLatest([
      this.allSeries$,
      this.sortValue$,
      this.currentPage$,
      this.selectedGenres$
    ]).pipe(
      map(([series, sort, page, genres]) => {

        if (!series.length) return [];

        let filtered = series;

        /* YEAR - CORRETTO */
        if (this.isYearFilterActive) {
          filtered = filtered.filter(
            s => s.annoPubblicazione === this.selectedYear
          );
        }

        /* GENRE */
        if (genres.size > 0) {
          filtered = filtered.filter(
            s => s.genere && genres.has(s.genere)
          );
        }

        if (!filtered.length) {
          this.pages = [];
          return [];
        }

        const sorted = this.sortSeries(filtered, sort);
        this.pages = this.getPages(sorted);

        const start = (page - 1) * this.itemsPerPage;
        return sorted.slice(start, start + this.itemsPerPage);
      })
    );
  }

  ngOnInit(): void {
    this.api.getSerieTv().subscribe(series => {

      // CORREZIONE: Gestione anno più robusta
      const normalized: SerieTv[] = series.map(s => ({
        ...s,
        annoPubblicazione: s.annoPubblicazione ?? s.anno_pubblicazione ?? null
      }));

      this.allSeries$.next(normalized);

      // CORREZIONE: Filtra solo anni validi
      const years = normalized
        .map(s => s.annoPubblicazione)
        .filter((y): y is number => typeof y === 'number' && !isNaN(y) && y > 0);

      if (years.length) {
        this.minYear = Math.min(...years);
        this.maxYear = Math.max(...years);
        this.selectedYear = this.maxYear;
        this.defaultYear = this.maxYear;
      }

      // Estrae generi
      const set = new Set<string>();
      normalized.forEach(s => {
        if (s.genere && s.genere.trim()) {
          set.add(s.genere);
        }
      });
      this.availableGenres = Array.from(set).sort();

      this.currentPage$.next(1);
    });
  }

  /* ===== ACTIONS ===== */

  changeYear(year: number): void {
    this.selectedYear = year;
    this.isYearFilterActive = true;
    this.currentPage$.next(1);
  }

  resetYearFilter(): void {
    this.selectedYear = this.defaultYear;
    this.isYearFilterActive = false;
    this.currentPage$.next(1);
  }

  changeSort(value: 'date' | 'score'): void {
    this.sortValue = value;
    this.sortValue$.next(value);
    this.currentPage$.next(1);
  }

  setSortDirection(direction: 'asc' | 'desc'): void {
    if (this.sortDirection === direction) return;
    this.sortDirection = direction;
    this.sortValue$.next(this.sortValue); // Forza ricalcolo
    this.currentPage$.next(1);
  }

  changePage(page: number): void {
    this.currentPage$.next(page);
  }

  toggleGenre(genre: string, checked: boolean): void {
    const set = new Set(this.selectedGenres$.value);
    checked ? set.add(genre) : set.delete(genre);
    this.selectedGenres$.next(set);
    this.currentPage$.next(1);
  }

  resetGenreFilter(): void {
    this.selectedGenres$.next(new Set());
    this.currentPage$.next(1);
  }

  onYearDragStart(): void {
    this.isDraggingYear = true;
  }

  onYearDragEnd(): void {
    this.isDraggingYear = false;
  }

  /* ===== HELPERS ===== */

  getPages(list: SerieTv[]): number[] {
    const total = Math.ceil(list.length / this.itemsPerPage);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  sortSeries(series: SerieTv[], mode: 'date' | 'score'): SerieTv[] {
    const dir = this.sortDirection === 'asc' ? 1 : -1;

    return [...series].sort((a, b) => {
      // CORREZIONE: Gestione valori nulli come nel componente games
      const valA = mode === 'score'
        ? (a.mediaVoti ?? -1)
        : (a.annoPubblicazione ?? 0);

      const valB = mode === 'score'
        ? (b.mediaVoti ?? -1)
        : (b.annoPubblicazione ?? 0);

      return (valA - valB) * dir;
    });
  }

  get isDefaultView(): boolean {
    return !this.isYearFilterActive && this.sortValue === 'date';
  }
}
