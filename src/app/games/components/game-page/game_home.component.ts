import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamesSectionComponent } from '../games-section/games-section.component';
import { MediaCacheService } from '../../../services/media-cache.service';
import { Game } from '../../models/game.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-game-home',
  standalone: true,
  imports: [CommonModule, GamesSectionComponent],
  templateUrl: './game_home.component.html',
  styleUrl: './game_home.component.css'
})
export class GameHomeComponent {
  games$!: Observable<{ newReleases: Game[]; upcoming: Game[]; best: Game[] }>;

  constructor(private cache: MediaCacheService) {
    this.games$ = this.cache.games$.pipe(
      map(games => ({
        newReleases: [...games].sort((a, b) => b.id - a.id),
        upcoming: [...games].sort(
          (a, b) => (a.annoPubblicazione ?? 0) - (b.annoPubblicazione ?? 0)
        ),
        best: [...games]
          .filter(g => g.mediaVoti != null)
          .sort((a, b) => (b.mediaVoti ?? 0) - (a.mediaVoti ?? 0)),
      }))
    );
  }
}
