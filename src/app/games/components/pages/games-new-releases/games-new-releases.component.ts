import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import { Game } from '../../../models/game.model';
import { GameCardComponent } from '../../game-cards/game-card.component';

export type PlatformKey = 'pc' | 'playstation' | 'xbox' | 'switch';
export const PLATFORM_LABELS: Record<PlatformKey, string> = {
  pc: 'PC',
  playstation: 'PlayStation',
  xbox: 'Xbox',
  switch: 'Nintendo Switch'
};

@Component({
  selector: 'app-games-new-releases',
  standalone: true,
  imports: [CommonModule, FormsModule, GameCardComponent],
  templateUrl: './games-new-releases.component.html',
  styleUrls: ['../../style-pages.css'],
})
export class GamesNewReleasesComponent implements OnInit {
  sortDirection: 'asc' | 'desc' = 'desc';


  mainPlatformKeys: PlatformKey[] = ['pc', 'playstation', 'xbox', 'switch'];

  minYear = 1995;
  maxYear = 2020;

  selectedYear!: number;
  defaultYear!: number;

  isYearFilterActive = false;
  isDraggingYear = false;

  platformLabels = PLATFORM_LABELS;

  selectedPlatforms$ = new BehaviorSubject<Set<PlatformKey>>(new Set());

  availableGenres: string[] = [];
  selectedGenres$ = new BehaviorSubject<Set<string>>(new Set());

  private allGames$ = new BehaviorSubject<Game[]>([]);
  private sortValue$ = new BehaviorSubject<'date' | 'score'>('date');

  currentPage$ = new BehaviorSubject<number>(1);

  sortValue: 'date' | 'score' = 'date';
  itemsPerPage = 15;
  pages: number[] = [];

  games$!: Observable<Game[]>;

  constructor(private api: ApiService) {

    this.games$ = combineLatest([
      this.allGames$,
      this.sortValue$,
      this.currentPage$,
      this.selectedPlatforms$,
      this.selectedGenres$
    ]).pipe(
      map(([games, sort, page, platforms, genres]) => {

        if (!games.length) return [];

        let filtered = games;

        if (this.isYearFilterActive) {
          filtered = filtered.filter(
            g => g.annoPubblicazione === this.selectedYear
          );
        }

        if (platforms.size > 0) {
          filtered = filtered.filter(game =>
            game.piattaforme?.some(p =>
              platforms.has(this.mapPiattaformaToKey(p))
            )
          );
        }

        if (genres.size > 0) {
          filtered = filtered.filter(game =>
            genres.has(game.genere)
          );
        }

        if (!filtered.length) {
          this.pages = [];
          return [];
        }

        const sorted = this.sortGames(filtered, sort);
        this.pages = this.getPages(sorted);

        const start = (page - 1) * this.itemsPerPage;
        return sorted.slice(start, start + this.itemsPerPage);
      })
    );
  }

  ngOnInit(): void {
    this.api.getGiochi().subscribe(games => {
      this.allGames$.next(games);

      const years = games
        .map(g => g.annoPubblicazione)
        .filter((y): y is number => true);

      this.selectedYear = Math.max(...years);
      this.defaultYear = this.selectedYear;
      this.currentPage$.next(1);
    });

    this.api.getGeneriGiochi().subscribe(genres => {
      this.availableGenres = genres;
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

  changeSort(value: 'date' | 'score'): void {
    this.sortValue = value;
    this.sortValue$.next(value);
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
  private mapPiattaformaToKey(value: string): PlatformKey {
    const v = value.toLowerCase();

    if (v.includes('playstation')) return 'playstation';
    if (v.includes('xbox')) return 'xbox';
    if (v.includes('switch') || v.includes('nintendo')) return 'switch';
    return 'pc';
  }

  getPages(games: Game[]): number[] {
    const total = Math.ceil(games.length / this.itemsPerPage);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  sortGames(games: Game[], mode: 'date' | 'score'): Game[] {
    const dir = this.sortDirection === 'asc' ? 1 : -1;

    return [...games].sort((a, b) => {
      const valA = mode === 'score' ? (a.mediaVoti ?? -1) : (a.annoPubblicazione ?? 0);
      const valB = mode === 'score' ? (b.mediaVoti ?? -1) : (b.annoPubblicazione ?? 0);
      return (valA - valB) * dir;
    });
  }

  setSortDirection(direction: 'asc' | 'desc'): void {
    if (this.sortDirection === direction) return;
    this.sortDirection = direction;
    this.currentPage$.next(1);
  }



  get isDefaultView(): boolean {
    return !this.isYearFilterActive && this.sortValue === 'date';
  }
}
