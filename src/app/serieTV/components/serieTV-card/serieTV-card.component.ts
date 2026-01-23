import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SerieTv } from '../../model/serie-tv.model';

@Component({
  selector: 'app-serie-tv-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './serieTV-card.component.html',
  styleUrls: ['./serieTV-card.component.css']
})
export class SerieTvCardComponent {
  @Input() serie!: SerieTv;

  get scoreClass(): string {
    if (this.serie.mediaVoti === undefined) return 'score-red';
    if (this.serie.mediaVoti >= 8) return 'score-green';
    if (this.serie.mediaVoti >= 6) return 'score-yellow';
    return 'score-red';
  }

  get scoreLabel(): string {
    if (this.serie.mediaVoti === undefined) return 'No reviews';
    if (this.serie.mediaVoti >= 8) return 'Generally Favorable';
    if (this.serie.mediaVoti >= 6) return 'Mixed or Average';
    return 'Generally Unfavorable';
  }
}
