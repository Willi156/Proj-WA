import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { TmdbService } from '../../../../services/tmdb.service';
import { TmdbMovie } from '../../../model/tmdb-movie.model';
import { FilmCardComponent } from '../../film-card/film-card.component';
import {TMDB_GENRE_MAP} from '../../../utils/tmdb-genres';

@Component({
  selector: 'app-movies-upcoming',
  standalone: true,
  imports: [CommonModule, FormsModule, FilmCardComponent],
  templateUrl: './movies-upcoming.component.html',
  styleUrls: ['../../../../games/components/style-pages.css'],
})
export class MoviesUpcomingComponent implements OnInit {

  /* ===== YEAR FILTER ===== */
  minYear = new Date().getFullYear();
  maxYear = this.minYear + 5;

  selectedYear!: number;
  defaultYear!: number;

  isYearFilterActive = false;
  isDraggingYear = false;

  /* ===== GENRES ===== */
  availableGenres: string[] = [];
  selectedGenres$ = new BehaviorSubject<Set<string>>(new Set());

  /* ===== STATE ===== */
  private allMovies$ = new BehaviorSubject<TmdbMovie[]>([]);
  currentPage$ = new BehaviorSubject<number>(1);

  itemsPerPage = 15;
  pages: number[] = [];

  movies$!: Observable<TmdbMovie[]>;

  constructor(private tmdb: TmdbService) {
    this.movies$ = combineLatest([
      this.allMovies$,
      this.currentPage$,
      this.selectedGenres$
    ]).pipe(
      map(([movies, page, genres]) => {

        let filtered = movies;

        /* YEAR FILTER */
        if (this.isYearFilterActive) {
          filtered = filtered.filter(
            m => m.annoPubblicazione === this.selectedYear
          );
        }

        /* GENRE FILTER */
        if (genres.size > 0) {
          filtered = filtered.filter(m =>
            m.genres.some(g => genres.has(g))
          );
        }

        this.pages = this.getPages(filtered);

        const start = (page - 1) * this.itemsPerPage;
        return filtered.slice(start, start + this.itemsPerPage);
      })
    );
  }

  ngOnInit(): void {
    this.tmdb.getUpcomingMovies()
      .pipe(
        map(raw => raw.map((m: any) => this.mapTmdbMovie(m)))
      )
      .subscribe(movies => {

        this.allMovies$.next(movies);

        /* GENRES DINAMICI */
        const genreSet = new Set<string>();
        movies.forEach(m =>
          m.genres.forEach(g => genreSet.add(g))
        );
        this.availableGenres = Array.from(genreSet).sort();

        /* YEAR INIT */
        const years = movies
          .map(m => m.annoPubblicazione)
          .filter((y): y is number => typeof y === 'number');

        this.selectedYear = Math.min(...years);
        this.defaultYear = this.selectedYear;
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

  getPages(list: TmdbMovie[]): number[] {
    const total = Math.ceil(list.length / this.itemsPerPage);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  private mapTmdbMovie(raw: any): TmdbMovie {
    return {
      id: raw.id,
      titolo: raw.title,
      annoPubblicazione: raw.release_date
        ? new Date(raw.release_date).getFullYear()
        : null,
      imageLink: raw.poster_path
        ? `https://image.tmdb.org/t/p/w500${raw.poster_path}`
        : undefined,
      mediaVoti: raw.vote_average ?? null,
      genres: raw.genre_ids
        ?.map((id: number) => TMDB_GENRE_MAP[id])
        .filter(Boolean) ?? []
    };
  }
}
