import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';

import { RawgService } from '../../../../services/rawg.service';
import { RawgGame } from '../../../models/rawg-game.model';
import { GameCardComponent } from '../../game-cards/game-card.component';
import { mapRawgPlatformToKey, PlatformKey } from '../../../utils/rawg-platform.util';
import {GOTY_TITLES} from '../../../utils/goty.util';

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
  private baseGames: RawgGame[] = [];


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


        if (this.showGotyOnly) {
          filtered = filtered
            .filter(g => GOTY_TITLES.some(x => x.slug === g.slug))
            .map(g => ({
              ...g,
              gotyYear: GOTY_TITLES.find(x => x.slug === g.slug)?.year
            }))
            .sort((a, b) => (b.gotyYear ?? 0) - (a.gotyYear ?? 0));
        }





        if (this.showGotyOnly) {
          filtered = [...filtered].sort(
            (a, b) => (b.annoPubblicazione ?? 0) - (a.annoPubblicazione ?? 0)
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
    const requests = [];

    for (let page = 1; page <= 5; page++) {
      requests.push(
        this.rawg.getBestGames({
          page,
          fromYear: 1990,
          toYear: new Date().getFullYear()
        })
      );
    }

    combineLatest(requests)
      .pipe(
        map(pages => pages.flat()),
        map(rawGames => rawGames.map(g => this.mapRawgGame(g))),
        map(games => games.slice(0, 100))
      )
      .subscribe(games => {
        this.baseGames = games;
        this.allGames$.next(games);

        const genreSet = new Set<string>();
        games.forEach(g => g.genres.forEach(gen => genreSet.add(gen)));
        this.availableGenres = Array.from(genreSet).sort();

        this.currentPage$.next(1);
      });
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
      slug: raw.slug,
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
  toggleGoty(): void {
    this.showGotyOnly = !this.showGotyOnly;
    this.currentPage$.next(1);

    // 🔙 SHOW ALL → ripristina lista completa
    if (!this.showGotyOnly) {
      this.allGames$.next(this.baseGames);
      return;
    }

    // 🏆 GOTY → costruisci lista dedicata
    const requests = GOTY_TITLES.map(goty =>
      this.rawg.getGameBySlug(goty.slug).pipe(
        map(raw =>
          raw
            ? {
              ...this.mapRawgGame(raw),
              gotyYear: goty.year
            }
            : null
        )
      )
    );

    combineLatest(requests).subscribe(list => {
      const games = list
        .filter(g => g !== null)
        .map(g => g as RawgGame)
        .sort((a, b) => (b.gotyYear ?? 0) - (a.gotyYear ?? 0));

      this.allGames$.next(games);
    });

  }





}
