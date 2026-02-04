import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';

import { RawgService } from '../../../../services/rawg.service';
import { RawgGame } from '../../../models/rawg-game.model';
import { GameCardComponent } from '../../game-cards/game-card.component';
import { mapRawgPlatformToKey, PlatformKey } from '../../../utils/rawg-platform.util';

const GOTY_TITLES: string[] = [
  'The Last of Us',
  'Dragon Age: Inquisition',
  'The Witcher 3: Wild Hunt',
  'Overwatch',
  'The Legend of Zelda: Breath of the Wild',
  'God of War',
  'Sekiro: Shadows Die Twice',
  'The Last of Us Part II',
  'It Takes Two',
  'Elden Ring',
  'Baldur’s Gate 3',
  'Astro Bot',
  'Clair Obscur: Expedition 33'
];

@Component({
  selector: 'app-games-best',
  standalone: true,
  imports: [CommonModule, FormsModule, GameCardComponent],
  templateUrl: './games-best-games.html',
  styleUrls: ['../../style-pages.css'],
})
export class GamesBestComponent implements OnInit {
  readonly platformKeys: PlatformKey[] = ['pc', 'playstation', 'xbox', 'switch'];

  showGotyOnly = false;

  /* ===== FILTERS ===== */
  selectedPlatforms$ = new BehaviorSubject<Set<PlatformKey>>(new Set());
  selectedGenres$ = new BehaviorSubject<Set<string>>(new Set());

  availableGenres: string[] = [];

  /* ===== PAGINATION ===== */
  itemsPerPage = 10;
  pages: number[] = [];
  currentPage$ = new BehaviorSubject<number>(1);

  /* ===== DATA ===== */
  private allGames$ = new BehaviorSubject<RawgGame[]>([]);
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

        /* GOTY */
        if (this.showGotyOnly) {
          filtered = filtered.filter(g =>
            GOTY_TITLES.some(title =>
              g.titolo.toLowerCase().includes(title.toLowerCase())
            )
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
    this.rawg.getBestGames()
      .pipe(
        map(raw => raw.map((g: any) => this.mapRawgGame(g)))
      )
      .subscribe(games => {
        this.allGames$.next(games);
        const genreSet = new Set<string>();
        games.forEach((g: { genres: any; }) => {
          (g.genres ?? []).forEach((gen: string) => genreSet.add(gen));
        });
        this.availableGenres = Array.from(genreSet).sort();
        this.selectedGenres$.next(new Set());
        this.selectedPlatforms$.next(new Set());
        this.currentPage$.next(1);
      });
  }
  toggleGoty(): void {
    this.showGotyOnly = !this.showGotyOnly;
    this.currentPage$.next(1);
  }

  togglePlatform(platform: PlatformKey, checked: boolean): void {
    const set = new Set(this.selectedPlatforms$.value);
    checked ? set.add(platform) : set.delete(platform);
    this.selectedPlatforms$.next(set);
    this.currentPage$.next(1);
  }

  toggleGenre(genre: string, checked: boolean): void {
    const set = new Set(this.selectedGenres$.value);
    checked ? set.add(genre) : set.delete(genre);
    this.selectedGenres$.next(set);
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


  changePage(page: number): void {
    this.currentPage$.next(page);
  }

  /* ===== HELPERS ===== */

  private getPages(games: RawgGame[]): number[] {
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
        .filter((p: PlatformKey | null): p is PlatformKey => p !== null),
      mediaVoti: this.normalizeScore(raw.metacritic)
    };
  }

  private normalizeScore(score: number | null): number | null {
    if (!score) return null;
    if (score >= 97) return 10;
    if (score >= 95) return 9;
    if (score >= 92) return 8;
    if (score >= 90) return 7;
    if (score >= 80) return 6;
    if (score >= 70) return 5;
    return 4;
  }


}
