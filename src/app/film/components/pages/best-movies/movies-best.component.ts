import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';

import { TmdbService } from '../../../../services/tmdb.service';
import { TmdbMovie } from '../../../model/tmdb-movie.model';
import { FilmCardComponent } from '../../film-card/film-card.component';
import {switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-movies-best',
  standalone: true,
  imports: [CommonModule, FormsModule, FilmCardComponent],
  templateUrl: './movies-best.component.html',
  styleUrls: ['../../../../games/components/style-pages.css'],
})
export class MoviesBestComponent implements OnInit {

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

  /* ===== STATE ===== */
  private allMovies$ = new BehaviorSubject<TmdbMovie[]>([]);
  currentPage$ = new BehaviorSubject<number>(1);
  private genreMap: Record<number, string> = {};

  itemsPerPage = 10;
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



  ngOnInit() {
    this.tmdb.getMovieGenres().pipe(
      switchMap(map => {
        this.genreMap = map;

        // carichiamo 5 pagine = ~100 film
        const requests = [];
        for (let page = 1; page <= 5; page++) {
          requests.push(
            this.tmdb.getBestMovies({
              minVote: 7,
              minVotes: 300,
              fromYear: 1980,
              toYear: this.maxYear,
              page
            })
          );
        }

        return combineLatest(requests);
      }),
      map((pages: any[][]) =>
        pages
          .flat()
          .map(m => this.mapTmdbMovie(m))
      )
    ).subscribe(movies => {

      this.allMovies$.next(movies);

      // generi leggibili
      const set = new Set<string>();
      movies.forEach(m => m.genres.forEach(g => set.add(g)));
      this.availableGenres = Array.from(set).sort();

      // init slider anno
      const years = movies
        .map(m => m.annoPubblicazione)
        .filter((y): y is number => typeof y === 'number');

      this.selectedYear = Math.max(...years);
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

  changePage(page: number): void {
    this.currentPage$.next(page);
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
      mediaVoti: raw.vote_average != null
        ? Math.round(raw.vote_average * 10) / 10
        : null,
      genres: raw.genre_ids
        ?.map((id: number) => this.genreMap[id])
        .filter(Boolean) ?? []
    };
  }

}
