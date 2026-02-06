import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {BehaviorSubject, combineLatest, map, Observable, switchMap} from 'rxjs';
import { TmdbService } from '../../../../services/tmdb.service';
import { SerieTv } from '../../../model/serie-tv.model';
import { SerieTvCardComponent } from '../../serieTV-card/serieTV-card.component';

@Component({
  selector: 'app-series-upcoming',
  standalone: true,
  imports: [CommonModule, FormsModule, SerieTvCardComponent],
  templateUrl: './series-upcoming.component.html',
  styleUrls: ['../../../../games/components/style-pages.css'],
})
export class SeriesUpcomingComponent implements OnInit {

  availableGenres: string[] = [];
  selectedGenres$ = new BehaviorSubject<Set<string>>(new Set());

  private allSeries$ = new BehaviorSubject<SerieTv[]>([]);
  currentPage$ = new BehaviorSubject<number>(1);

  itemsPerPage = 15;
  pages: number[] = [];

  series$!: Observable<SerieTv[]>;

  private genreMap: Record<number, string> = {};

  constructor(private tmdb: TmdbService) {
    this.series$ = combineLatest([
      this.allSeries$,
      this.currentPage$,
      this.selectedGenres$
    ]).pipe(
      map(([series, page, genres]) => {
        let filtered = series;

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

  ngOnInit(): void {
    this.tmdb.getTvGenres().pipe(
      switchMap(map => {
        this.genreMap = map;
        return this.tmdb.getUpcomingSeries();
      }),
      map(raw => raw.map(s => this.mapTmdbSeries(s)))
    ).subscribe(series => {
      this.allSeries$.next(series);

      const set = new Set<string>();
      series.forEach(s => s.genere && set.add(s.genere));
      this.availableGenres = Array.from(set).sort();

      this.currentPage$.next(1);
    });
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

  private getPages(list: SerieTv[]): number[] {
    return Array.from(
      { length: Math.ceil(list.length / this.itemsPerPage) },
      (_, i) => i + 1
    );
  }

  private mapTmdbSeries(raw: any): SerieTv {
    return {
      id: raw.id,
      titolo: raw.name,
      descrizione: raw.overview,
      annoPubblicazione: raw.first_air_date
        ? new Date(raw.first_air_date).getFullYear()
        : undefined,
      imageLink: raw.poster_path
        ? `https://image.tmdb.org/t/p/w500${raw.poster_path}`
        : undefined,
      mediaVoti: raw.vote_average ?? undefined,
      genere: raw.genre_ids?.length
        ? this.genreMap[raw.genre_ids[0]]
        : undefined,
      in_corso: true
    };
  }
}

