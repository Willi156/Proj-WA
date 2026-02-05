import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import { Film } from '../../../model/film.model';
import { FilmCardComponent } from '../../film-card/film-card.component';

@Component({
  selector: 'app-movies-released',
  standalone: true,
  imports: [CommonModule, FormsModule, FilmCardComponent],
  templateUrl: './movies-released.component.html',
  styleUrls: ['../../../../games/components/style-pages.css'],
})
export class MoviesReleasedComponent implements OnInit {


  /* ===== SORT ===== */
  sortDirection: 'asc' | 'desc' = 'desc';
  sortValue: 'date' | 'score' = 'date';
  private sortValue$ = new BehaviorSubject<'date' | 'score'>('date');

  /* ===== YEAR FILTER ===== */
  minYear = 2000;
  maxYear = new Date().getFullYear();

  selectedYear!: number;
  defaultYear!: number;

  isYearFilterActive = false;
  isDraggingYear = false;

  /* ===== GENRES ===== */
  availableGenres: string[] = [];
  selectedGenres$ = new BehaviorSubject<Set<string>>(new Set());

  /* ===== DATA ===== */
  private allFilms$ = new BehaviorSubject<Film[]>([]);
  currentPage$ = new BehaviorSubject<number>(1);

  itemsPerPage = 15;
  pages: number[] = [];

  films$!: Observable<Film[]>;

  constructor(private api: ApiService) {

    this.films$ = combineLatest([
      this.allFilms$,
      this.sortValue$,
      this.currentPage$,
      this.selectedGenres$
    ]).pipe(
      map(([films, sort, page, genres]) => {

        if (!films.length) return [];

        let filtered = films;

        /* YEAR FILTER */
        if (this.isYearFilterActive) {
          filtered = filtered.filter(
            f => f.annoPubblicazione === this.selectedYear
          );
        }

        /* GENRE FILTER */
        if (genres.size > 0) {
          filtered = filtered.filter(f =>
            f.genere && genres.has(f.genere)
          );
        }

        if (!filtered.length) {
          this.pages = [];
          return [];
        }

        const sorted = this.sortFilms(filtered, sort);
        this.pages = this.getPages(sorted);

        const start = (page - 1) * this.itemsPerPage;
        return sorted.slice(start, start + this.itemsPerPage);
      })
    );
  }

  /* ===== INIT ===== */
  ngOnInit(): void {
    this.api.getFilm().subscribe(films => {
      console.log('🎬 FILMS RAW DAL BACKEND:', films);

      this.allFilms$.next(films);

      // ===== YEARS =====
      const years = films
        .map(f => f.annoPubblicazione)
        .filter((y): y is number => typeof y === 'number');

      if (years.length) {
        this.selectedYear = Math.max(...years);
        this.defaultYear = this.selectedYear;
        this.minYear = Math.min(...years);
        this.maxYear = Math.max(...years);
      }

      // ===== GENRES =====
      const set = new Set<string>();
      films.forEach(f => {
        if (f.genere) set.add(f.genere);
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
    this.currentPage$.next(1);
  }

  changePage(page: number): void {
    this.currentPage$.next(page);
  }

  toggleGenre(genre: string, checked: boolean): void {
    const current = new Set(this.selectedGenres$.value);
    checked ? current.add(genre) : current.delete(genre);
    this.selectedGenres$.next(current);
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

  getPages(films: Film[]): number[] {
    const total = Math.ceil(films.length / this.itemsPerPage);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  sortFilms(films: Film[], mode: 'date' | 'score'): Film[] {
    const dir = this.sortDirection === 'asc' ? 1 : -1;

    return [...films].sort((a, b) => {
      const valA =
        mode === 'score'
          ? (a.mediaVoti ?? -1)
          : (a.annoPubblicazione ?? 0);

      const valB =
        mode === 'score'
          ? (b.mediaVoti ?? -1)
          : (b.annoPubblicazione ?? 0);

      return (valA - valB) * dir;
    });
  }

  get isDefaultView(): boolean {
    return !this.isYearFilterActive && this.sortValue === 'date';
  }
}
