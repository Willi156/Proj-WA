import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { Film } from '../../model/film.model';
import { FilmSectionComponent } from '../film-section/ film-section.component';

@Component({
  selector: 'app-film-page',
  standalone: true,
  imports: [CommonModule, FilmSectionComponent],
  templateUrl: './film-page.component.html',
  styleUrls: ['./film-page.component.css']
})
export class FilmPageComponent implements OnInit {

  films: Film[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getFilm().subscribe(films => {
      this.films = films;
    });
  }
}
