import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Film } from '../../model/film.model';
import {Router} from '@angular/router';
import {TmdbMovie} from '../../model/tmdb-movie.model';
@Component({
  selector: 'app-film-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './film-card.component.html',
  styleUrls: ['./film-card.component.css']
})
export class FilmCardComponent {
  constructor(private router: Router) {}
  @Input() film!: Film | TmdbMovie;
  @Input() mode: 'date' | 'score' = 'date';
  @Input() variant: 'default' | 'upcoming' = 'default';

  get scoreValue(): number | null {
    const v = this.film?.mediaVoti;
    return typeof v === 'number' ? v : null;
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
      ['/details', 'MOVIE', this.film.id],
      {
        state: {
          contenuto: this.film
        }
      }
    );
  }
}
