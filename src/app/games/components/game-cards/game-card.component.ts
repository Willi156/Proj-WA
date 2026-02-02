import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Game } from '../../models/game.model';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.css'
})

export class GameCardComponent {
  @Input() game!: Game;
  @Input() mode: 'date' | 'score' = 'date';

  get scoreClass(): string {
    if (this.game.mediaVoti >= 8) return 'score-green';
    if (this.game.mediaVoti >= 6) return 'score-yellow';
    return 'score-red';
  }

  get scoreLabel(): string {
    if (this.game.mediaVoti >= 8) return 'Generally Favorable';
    if (this.game.mediaVoti >= 6) return 'Mixed or Average';
    return 'Generally Unfavorable';
  }
}
