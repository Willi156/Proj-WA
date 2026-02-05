import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Game } from '../../models/game.model';
import {RawgGame} from '../../models/rawg-game.model';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.css'
})
export class GameCardComponent {
  constructor(private router: Router) {}

  @Input() game!: Game | RawgGame;
  @Input() mode: 'date' | 'score' = 'date';
  @Input() variant: 'default' | 'upcoming' = 'default';


  get scoreValue(): number | null {
    return typeof this.game.mediaVoti === 'number'
      ? this.game.mediaVoti
      : null;
  }
  get scoreClass(): string {
    if (this.scoreValue === null) return 'score-na';
    if (this.scoreValue >= 8) return 'score-green';
    if (this.scoreValue >= 6) return 'score-yellow';
    return 'score-red';
  }
  get scoreLabel(): string {
    if (this.scoreValue === null) return 'No Score';
    if (this.scoreValue >= 8) return 'Generally Favorable';
    if (this.scoreValue >= 6) return 'Mixed or Average';
    return 'Generally Unfavorable';
  }

  openDetails() {
    this.router.navigate(
      ['/details', 'GAME', this.game.id],
      {
        state: {
          contenuto: this.game
        }
      }
    );
  }
}
