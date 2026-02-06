import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TmdbService } from '../../../../services/tmdb.service';
import { SerieTv } from '../../../model/serie-tv.model';
import {SerieTvCardComponent} from '../../serieTV-card/serieTV-card.component';

@Component({
  selector: 'app-series-best-tv',
  standalone: true,
  imports: [CommonModule, FormsModule, SerieTvCardComponent],
  templateUrl: './series-best-TV.component.html',
  styleUrls: ['../../../../games/components/style-pages.css'],
})

export class SeriesBestTvComponent implements OnInit {
  minYear = 1980;
  maxYear = new Date().getFullYear();

  selectedYear!: number;
  defaultYear!: number;

  isYearFilterActive = false;
  isDraggingYear = false;


  availableGenres: string[] = [];
  selectedGenres$ = new BehaviorSubject<Set<string>>(new Set());

  private allSeries$ = new BehaviorSubject<SerieTv[]>([]);
  currentPage$ = new BehaviorSubject<number>(1);
  private genreMap: Record<number, string> = {};

  itemsPerPage = 10;
  pages: number[] = [];

  series$!: Observable<SerieTv[]>;

  constructor(private tmdb: TmdbService) {
    this.series$ = combineLatest([
      this.allSeries$,
      this.currentPage$,
      this.selectedGenres$
    ]).pipe(
      map(([series, page, genres]) => {
        let filtered = series;

        if (this.isYearFilterActive) {
          filtered = filtered.filter(
            s =>
              typeof s.annoPubblicazione === 'number' &&
              s.annoPubblicazione <= this.selectedYear
          );
        }


        if (genres.size > 0) {
          filtered = filtered.filter(s =>
            s.genere && genres.has(s.genere)
          );
        }

        this.pages = this.getPages(filtered);

        const start = (page - 1) * this.itemsPerPage;
        return filtered.slice(start, start + this.itemsPerPage);
      })
    );
  }

  ngOnInit() {
    this.tmdb.getTvGenres().pipe(
      switchMap(map => {
        this.genreMap = map;

        const requests = [];
        for (let page = 1; page <= 5; page++) {
          requests.push(
            this.tmdb.getBestSeries({
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
          .map(s => this.mapTmdbSeries(s))
      )
    ).subscribe(series => {
      this.allSeries$.next(series);

      const set = new Set<string>();
      series.forEach(s => {
        if (s.genere) set.add(s.genere);
      });
      this.availableGenres = Array.from(set).sort();

      const years = series
        .map(s => s.annoPubblicazione)
        .filter((y): y is number => typeof y === 'number' && y > 0);

      if (years.length > 0) {
        this.selectedYear = Math.max(...years);
        this.defaultYear = this.selectedYear;
      } else {
        this.selectedYear = this.maxYear;
        this.defaultYear = this.selectedYear;
      }

      this.currentPage$.next(1);
    });
  }

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

  getPages(list: SerieTv[]): number[] {
    const total = Math.ceil(list.length / this.itemsPerPage);
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  private mapTmdbSeries(raw: any): SerieTv {
    return {
      id: raw.id,
      titolo: raw.name,
      annoPubblicazione: raw.first_air_date
        ? new Date(raw.first_air_date).getFullYear()
        : undefined,
      descrizione: raw.overview,
      genere: raw.genre_ids?.length > 0
        ? this.genreMap[raw.genre_ids[0]]
        : undefined,
      imageLink: raw.poster_path
        ? `https://image.tmdb.org/t/p/w500${raw.poster_path}`
        : undefined,
      mediaVoti: raw.vote_average != null
        ? Math.round(raw.vote_average * 10) / 10
        : undefined,
      in_corso: raw.in_production ?? undefined,
      stagioni: raw.number_of_seasons ?? undefined
    };
  }
}
