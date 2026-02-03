import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { mapRawgPlatformToKey, PlatformKey } from '../../../utils/rawg-platform.util';
import { RawgService } from '../../../../services/rawg.service';
import { RawgGame } from '../../../models/rawg-game.model';
import { GameCardComponent } from '../../game-cards/game-card.component';

export const PLATFORM_LABELS: Record<PlatformKey, string> = {
  pc: 'PC',
  playstation: 'PlayStation',
  xbox: 'Xbox',
  switch: 'Nintendo Switch'
};

@Component({
  selector: 'app-games-upcoming',
  standalone: true,
  imports: [CommonModule, FormsModule, GameCardComponent],
  templateUrl: './games-upcoming.component.html',
  styleUrls: ['../../style-pages.css'],
})
export class GamesUpcomingComponent implements OnInit {
  platformLabels = PLATFORM_LABELS;
  mainPlatformKeys: PlatformKey[] = ['pc', 'playstation', 'xbox', 'switch'];

  selectedPlatforms$ = new BehaviorSubject<Set<PlatformKey>>(new Set());
  selectedGenres$ = new BehaviorSubject<Set<string>>(new Set());

  availableGenres: string[] = [];

  minYear = new Date().getFullYear();
  maxYear = 2027;
  selectedYear!: number;
  defaultYear!: number;

  isYearFilterActive = false;
  isDraggingYear = false;

  private allGames$ = new BehaviorSubject<RawgGame[]>([]);
  currentPage$ = new BehaviorSubject<number>(1);

  itemsPerPage = 15;
  pages: number[] = [];

  games$!: Observable<RawgGame[]>;

  constructor(private rawg: RawgService) {

    this.games$ = combineLatest([
      this.allGames$,
      this.currentPage$,
      this.selectedPlatforms$,
      this.selectedGenres$
    ]).pipe(
      map(([games, page, platforms, genres]) => {
        let filtered = games;
        if (this.isYearFilterActive) {
          filtered = filtered.filter(
            g => g.annoPubblicazione === this.selectedYear
          );
        }
        if (platforms.size > 0) {
          filtered = filtered.filter(g =>
            g.platformKeys.some(pk => platforms.has(pk))
          );
        }
        if (genres.size > 0) {
          filtered = filtered.filter(g =>
            g.genres.some(gen => genres.has(gen))
          );
        }

        this.pages = this.getPages(filtered);

        const start = (page - 1) * this.itemsPerPage;
        return filtered.slice(start, start + this.itemsPerPage);
      })
    );
  }
  ngOnInit(): void {
    this.rawg.getUpcomingGames(40)
      .pipe(
        map(rawGames => rawGames.map((g: any) => this.mapRawgGame(g)))
      )
      .subscribe(games => {

        this.allGames$.next(games);

        /* GENRES DINAMICI */
        const genreSet = new Set<string>();
        games.forEach((g: { genres: string[]; }) => g.genres.forEach((gen: string) => genreSet.add(gen)));
        this.availableGenres = Array.from(genreSet).sort();

        /* YEAR INIT */
        const years = games
          .map((g: { annoPubblicazione: any; }) => g.annoPubblicazione)
          .filter((y: any): y is number => typeof y === 'number');

        this.selectedYear = Math.min(...years);
        this.defaultYear = this.selectedYear;
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

  changePage(page: number): void {
    this.currentPage$.next(page);
  }

  togglePlatform(platform: PlatformKey, checked: boolean): void {
    const current = new Set(this.selectedPlatforms$.value);
    checked ? current.add(platform) : current.delete(platform);
    this.selectedPlatforms$.next(current);
    this.currentPage$.next(1);
  }

  toggleGenre(genre: string, checked: boolean): void {
    const current = new Set(this.selectedGenres$.value);
    checked ? current.add(genre) : current.delete(genre);
    this.selectedGenres$.next(current);
    this.currentPage$.next(1);
  }

  resetPlatformFilter(): void {
    this.selectedPlatforms$.next(new Set());
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
  getPages(games: RawgGame[]): number[] {
    const total = Math.ceil(games.length / this.itemsPerPage);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  private mapRawgGame(raw: any): RawgGame {
    return {
      id: raw.id,
      titolo: raw.name,
      annoPubblicazione: raw.released
        ? new Date(raw.released).getFullYear()
        : null,
      imageLink: raw.background_image,
      genres: raw.genres?.map((g: any) => g.name) ?? [],
      platformKeys: raw.platforms
        ?.map((p: any) => mapRawgPlatformToKey(p.platform.name))
        .filter((p: PlatformKey | null): p is PlatformKey => p !== null)



    };
  }
}
