import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';
import { Game } from '../../../models/game.model';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { Observable } from 'rxjs';
import { GameCardComponent } from '../../game-cards/game-card.component';

const MOCK_PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Switch'];

@Component({
  selector: 'app-games-new-releases',
  standalone: true,
  imports: [CommonModule, FormsModule, GameCardComponent],
  templateUrl: './games-new-releases.component.html',
  styleUrls: ['../../style-pages.css'],
})
export class GamesNewReleasesComponent implements OnInit {
  minYear = 1995;
  maxYear = 2020;
  selectedYear!: number;
  defaultYear!: number;

  isYearFilterActive = false;
  isDraggingYear = false;

  availablePlatform = []
  platformFilter$ = new BehaviorSubject<Set<string>>(new Set());

  availableGenres = [
    { key: 'Action', label: 'Action' },
    { key: 'RPG', label: 'RPG' },
    { key: 'Shooter', label: 'Shooter' },
    { key: 'Adventure', label: 'Adventure' },
    { key: 'Sports', label: 'Sports' }
  ];
  genereFilter$ = new BehaviorSubject<Set<string>>(new Set());

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
      this.genereFilter$
    ]).pipe(
      map(([games, sort, page, platforms]) => {

        if (!games.length) return [];

        let filtered = games;

        if (this.isYearFilterActive) {
          filtered = filtered.filter(
            g => g.annoPubblicazione === this.selectedYear
          );
        }
        if (platforms.size > 0) {
          filtered = filtered.filter(game =>
            game.platform?.some(p => platforms.has(p))
          );
        }
        const genres = this.genereFilter$.value;

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
    this.api.getGiochi().pipe(
      map((res: any) => Array.isArray(res) ? res : res?.data ?? []),
      map(games =>
        [...games]
          .sort((a, b) => (b.annoPubblicazione ?? 0) - (a.annoPubblicazione ?? 0))
          .slice(0, 50)
          .map(game => ({
            ...game,
            platform: game.platform && game.platform.length
              ? game.platform
              : this.assignMockPlatforms()
          }))
      )
    ).subscribe(games => {
      console.log('📦 Giochi dal DB:', games);
      console.log('🎮 Esempio genere:', games.map(g => g.genere));
      this.allGames$.next(games);

      const years = games
        .map(g => g.annoPubblicazione)
        .filter((y): y is number => typeof y === 'number');

      this.selectedYear = Math.max(...years);
      this.defaultYear = this.selectedYear;

      this.isYearFilterActive = false;
      this.currentPage$.next(1);
    });
    this.api.getPiattaformeName().subscribe((res: any)=>  {this.platformFilter$.next(res)})
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

  togglePlatform(platform: string, checked: boolean): void {
    const current = new Set(this.platformFilter$.value);
    checked ? current.add(platform) : current.delete(platform);
    this.platformFilter$.next(current);
    this.currentPage$.next(1);
  }

  resetPlatformFilter(): void {
    this.platformFilter$.next(new Set());
    this.currentPage$.next(1);
  }

  toggleGenre(genre: string, checked: boolean): void {
    const current = new Set(this.genereFilter$.value);

    if (checked) {
      current.add(genre);
    } else {
      current.delete(genre);
    }

    this.genereFilter$.next(current);
    this.currentPage$.next(1);
  }

  resetGenreFilter(): void {
    this.genereFilter$.next(new Set());
    this.currentPage$.next(1);
  }


  onYearDragStart(): void {
    this.isDraggingYear = true;
  }

  onYearDragEnd(): void {
    this.isDraggingYear = false;
  }

  getPages(games: Game[]): number[] {
    const total = Math.ceil(games.length / this.itemsPerPage);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  sortGames(games: Game[], mode: 'date' | 'score'): Game[] {
    const copy = [...games];
    return mode === 'score'
      ? copy.sort((a, b) => (b.mediaVoti ?? -1) - (a.mediaVoti ?? -1))
      : copy.sort((a, b) => (b.annoPubblicazione ?? 0) - (a.annoPubblicazione ?? 0));
  }

  private assignMockPlatforms(): string[] {
    const shuffled = [...MOCK_PLATFORMS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.random() > 0.6 ? 2 : 1);
  }

  get isDefaultView(): boolean {
    return !this.isYearFilterActive && this.sortValue === 'date';
  }

  protected readonly HTMLInputElement = HTMLInputElement;
}
