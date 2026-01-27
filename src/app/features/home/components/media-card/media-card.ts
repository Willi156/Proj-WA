import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaItem } from '../../../../shared/models/media-item';

@Component({
  selector: 'app-media-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media-card.html',
  styleUrl: './media-card.css',
})
export class MediaCardComponent {
  @Input({ required: true }) item!: MediaItem;

  @Output() cardClick = new EventEmitter<void>();

  get score(): number {
    return (this.item as any).criticScore ?? 0;
  }

  get scoreClass(): string {
    const s = this.score;
    if (s >= 7.5) return 'score score-green';
    if (s >= 6.0) return 'score score-blue';
    if (s >= 5.0) return 'score score-yellow';
    if (s >= 1.0) return 'score score-orange';
    return 'score score-orange';
  }

  get scoreLabel(): string {
    const s = this.score;
    if (s >= 7.5) return 'Universal Acclaim';
    if (s >= 6.0) return 'Generally Favorable';
    if (s >= 5.0) return 'Mixed or Average';
    return 'Generally Unfavorable';
  }
}
