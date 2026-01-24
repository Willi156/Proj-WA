import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Film } from '../../model/film.model';

@Component({
  selector: 'app-film-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './film-card.component.html',
  styleUrls: ['./film-card.component.css']
})
export class FilmCardComponent {
  @Input() film!: Film;

  get scoreClass(): string {
    if (this.film.mediaVoti === undefined) return 'score-red';
    if (this.film.mediaVoti >= 8) return 'score-green';
    if (this.film.mediaVoti >= 6) return 'score-yellow';
    return 'score-red';
  }

  get scoreLabel(): string {
    if (this.film.mediaVoti === undefined) return 'No reviews';
    if (this.film.mediaVoti >= 8) return 'Generally Favorable';
    if (this.film.mediaVoti >= 6) return 'Mixed or Average';
    return 'Generally Unfavorable';
  }
}
