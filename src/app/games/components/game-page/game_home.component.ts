import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamesSectionComponent } from '../games-section/games-section.component';
import { ApiService } from '../../../services/api.service';
import {Game} from '../../models/game.model';


@Component({
  selector: 'app-game-home',
  standalone: true,
  imports: [CommonModule, GamesSectionComponent],
  templateUrl: './game_home.component.html',
  styleUrl: './game_home.component.css'
})

export class GameHomeComponent implements OnInit {

  allGames: Game[] = [];

  newReleases: Game[] = [];
  upcomingGames: Game[] = [];
  bestGames: Game[] = [];

  loading = true;
  error: string | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getGiochi().subscribe({
      next: (games) => {
        this.allGames = games;
        this.buildSections();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Errore nel recupero dei giochi';
      }
    });
  }

  private buildSections(): void {
    this.newReleases = [...this.allGames]
      .sort((a, b) => b.id - a.id);

    this.upcomingGames = [...this.allGames]
      .sort((a, b) => (a.annoPubblicazione ?? 0) - (b.annoPubblicazione ?? 0));

    this.bestGames = [...this.allGames]
      .filter(g => g.mediaVoti !== null && g.mediaVoti !== undefined)
      .sort((a, b) => (b.mediaVoti ?? 0) - (a.mediaVoti ?? 0));
  }
}
