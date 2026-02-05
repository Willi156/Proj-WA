import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SerieTv } from '../../model/serie-tv.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-serie-tv-card',  // Cambiato per corrispondere all'HTML
  standalone: true,
  imports: [CommonModule],
  templateUrl: './serieTV-card.component.html',
  styleUrls: ['./serieTV-card.component.css']
})
export class SerieTvCardComponent {
  constructor(private router: Router) {}

  @Input() serie!: SerieTv;
  @Input() mode: 'date' | 'score' = 'date';

  get scoreValue(): number | null {
    return typeof this.serie.mediaVoti === 'number'
      ? this.serie.mediaVoti
      : null;
  }

  get displayScore(): string {
    return this.scoreValue !== null ? this.scoreValue.toString() : '-';
  }

  get scoreClass(): string {
    if (this.scoreValue === null) return 'score-red';
    if (this.scoreValue >= 8) return 'score-green';
    if (this.scoreValue >= 6) return 'score-yellow';
    return 'score-red';
  }

  get scoreLabel(): string {
    if (this.scoreValue === null) return 'No reviews';
    if (this.scoreValue >= 8) return 'Generally Favorable';
    if (this.scoreValue >= 6) return 'Mixed or Average';
    return 'Generally Unfavorable';
  }

  openDetails() {
    this.router.navigate(
      ['/details', 'SERIES', this.serie.id],
      { state: { contenuto: this.serie } }
    );
  }
}
