import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GameCardComponent } from './games/components/game-card.component';
import { GamesSectionComponent } from './games/components/games-section/games-section.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,
    GameCardComponent,
    GamesSectionComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Critiverse');

  gamesMock = [
    {
      title: 'Elden Ring',
      rating: 9.6,
      platforms: ['PC', 'PS5', 'Xbox'],
      image: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Elden_Ring_Box_art.jpg'
    },
    {
      title: 'Cyberpunk 2077',
      rating: 8.5,
      platforms: ['PC', 'PS5', 'Xbox'],
      image: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Cyberpunk_2077_box_art.jpg'
    },
    {
      title: 'God of War Ragnarök',
      rating: 9.4,
      platforms: ['PS5'],
      image: 'https://upload.wikimedia.org/wikipedia/en/e/ee/God_of_War_Ragnar%C3%B6k_cover.jpg'
    },
    {
      title: 'Zelda: Tears of the Kingdom',
      rating: 9.7,
      platforms: ['Switch'],
      image: 'https://upload.wikimedia.org/wikipedia/en/f/fb/The_Legend_of_Zelda_Tears_of_the_Kingdom_cover.jpg'
    },
    {
      title: 'Starfield',
      rating: 8.8,
      platforms: ['PC', 'Xbox'],
      image: 'https://upload.wikimedia.org/wikipedia/en/5/51/Starfield_cover_art.jpg'
    },
    {
      title: 'Hogwarts Legacy',
      rating: 8.9,
      platforms: ['PC', 'PS5', 'Xbox'],
      image: 'https://upload.wikimedia.org/wikipedia/en/3/3c/Hogwarts_Legacy_cover.jpg'
    }
  ];


}

