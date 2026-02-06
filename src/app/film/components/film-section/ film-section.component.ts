import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilmCardComponent } from '../film-card/film-card.component';
import { Film } from '../../model/film.model';
import {Router} from '@angular/router';

@Component({
  selector: 'app-film-section',
  standalone: true,
  imports: [CommonModule, FilmCardComponent],
  templateUrl: './film-section.component.html',
  styleUrls: ['./film-section.component.css']
})
export class FilmSectionComponent implements OnChanges, OnInit {
  @Input() seeAllPath!: string;
  @Input() title!: string;
  @Input() films: Film[] = [];

  visibleCount = 5;
  startIndex = 0;
  visibleFilms: Film[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.updateVisibleFilms();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['films']) {
      this.startIndex = 0;
      this.updateVisibleFilms();
    }
  }

  updateVisibleFilms() {
    this.visibleFilms = this.films.slice(
      this.startIndex,
      this.startIndex + this.visibleCount
    );
  }

  next() {
    if (this.startIndex + this.visibleCount < this.films.length) {
      this.startIndex += this.visibleCount;
      this.updateVisibleFilms();
    }
  }

  prev() {
    if (this.startIndex > 0) {
      this.startIndex -= this.visibleCount;
      this.updateVisibleFilms();
    }
  }

  get isPrevDisabled() {
    return this.startIndex === 0;
  }

  get isNextDisabled() {
    return this.startIndex + this.visibleCount >= this.films.length;
  }

  trackById(index: number, film: Film): number {
    return film.id;
  }
  openSeeAll() {
    if(!this.seeAllPath) return;
    this.router.navigate([this.seeAllPath])
  }
}
