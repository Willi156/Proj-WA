import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaCacheService } from '../../../services/media-cache.service';
import { Film } from '../../model/film.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {FilmSectionComponent} from '../film-section/ film-section.component';

@Component({
  selector: 'app-film-page',
  standalone: true,
  imports: [CommonModule, FilmSectionComponent],
  templateUrl: './film-page.component.html',
  styleUrls: ['./film-page.component.css']
})
export class FilmPageComponent {
  films$!: Observable<{ newReleases: Film[]; upcoming: Film[]; best: Film[] }>;

  constructor(private cache: MediaCacheService) {
    this.films$ = this.cache.films$.pipe(
      map((films: Film[]) => ({
        newReleases: films.slice(0,5),
        upcoming:    films.slice(5,10),
        best:        films.slice(10,15),
      }))
    );
  }
}
