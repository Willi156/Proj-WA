import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';

import { TmdbService } from '../../../../services/tmdb.service';
import { SerieTv } from '../../../model/serie-tv.model';
import { SerieTvCardComponent } from '../../serieTV-card/serieTV-card.component';

type SerieUpcomingView = SerieTv & {
  annoPubblicazione?: number;
  genres?: string[];
};

@Component({
  selector: 'app-series-upcoming',
  standalone: true,
  imports: [CommonModule, FormsModule, SerieTvCardComponent],
  templateUrl: './series-upcoming.component.html',
  styleUrls: ['../../../../games/components/style-pages.css'],
})
export class SeriesUpcomingComponent implements OnInit {

  /* ===== YEAR FILTER ===== */
  minYear = new Date().getFullYear();
  maxYear = this.minYear + 3;

  selectedYear!: number;
  defaultYear!: number;

  isYearFilterActive = false;
  isDraggingYear = false;

  /* ===== GENRES ===== */
  availableGenres: string[] = [];
  selectedGenres$ = new BehaviorSubject<Set<string>>(new Set());

  /* ===== DATA ===== */
  private allSeries$ = new BehaviorSubject<SerieUpcomingView[]>([]);
  currentPage$ = new BehaviorSubject<number>(1);

  itemsPerPage = 15;
  pages: number[] = [];

  series$!: Observable<SerieUpcomingView[]>;

  constructor(private tmdb: TmdbService) {

    this.series$ = combineLatest([
      this.allSeries$,
      this.currentPage$,
      this.selectedGenres$
    ]).pipe(
      map(([series, page, genres]) => {

        let filtered = series;

        /* YEAR FILTER */
        if (this.isYearFilterActive) {
          filtered = filtered.filter(
            s => s.annoPubblicazione === this.selectedYear
          );
        }

        /* GENRE FILTER */
        if (genres.size > 0) {
          filtered = filtered.filter(s =>
            s.genres?.some(g => genres.has(g))
          );
        }

        this.pages = this.getPages(filtered);

        const start = (page - 1) * this.itemsPerPage;
        return filtered.slice(start, start + this.itemsPerPage);
      })
    );
  }

  /* ===== INIT ===== */
  ngOnInit(): void {
    this.tmdb.getUpcomingSeries()
      .pipe(
        map(raw => raw.map(s => this.mapTmdbSeries(s)))
      )
      .subscribe(series => {

        this.allSeries$.next(series);

        /* GENRES DINAMICI */
        const genreSet = new Set<string>();
        series.forEach(s =>
          s.genres?.forEach(g => genreSet.add(g))
        );
        this.availableGenres = Array.from(genreSet).sort();

        /* YEAR INIT */
        const years = series
          .map(s => s.annoPubblicazione)
          .filter((y): y is number => typeof y === 'number');

        if (years.length) {
          this.selectedYear = Math.min(...years);
          this.defaultYear = this.selectedYear;
        } else {
          this.selectedYear = this.minYear;
          this.defaultYear = this.minYear;
        }

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

  private getPages(list: SerieUpcomingView[]): number[] {
    const total = Math.ceil(list.length / this.itemsPerPage);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  private mapTmdbSeries(raw: any): SerieUpcomingView {
    const firstAirYear = raw.first_air_date
      ? new Date(raw.first_air_date).getFullYear()
      : undefined;

    return {
      id: raw.id,
      titolo: raw.name,
      descrizione: raw.overview,
      annoPubblicazione: firstAirYear,
      imageLink: raw.poster_path
        ? `https://image.tmdb.org/t/p/w500${raw.poster_path}`
        : undefined,
      mediaVoti: raw.vote_average ?? undefined,
      genere: raw.genre_ids?.[0]?.toString(),
      genres: raw.genre_ids?.map((id: number) => id.toString()) ?? [],
      link: `https://www.themoviedb.org/tv/${raw.id}`,
      in_corso: raw.in_production
    };
  }
}
