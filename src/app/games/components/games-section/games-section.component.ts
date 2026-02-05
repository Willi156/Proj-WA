import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameCardComponent } from '../game-cards/game-card.component';
import { Game } from '../../models/game.model';
import { RawgService } from '../../../services/rawg.service';
import {Router} from '@angular/router';


@Component({
  selector: 'app-games-section',
  standalone: true,
  imports: [CommonModule, GameCardComponent],
  templateUrl: './games-section.component.html',
  styleUrl: './games-section.component.css'
})
export class GamesSectionComponent implements OnInit {
  @Input() title!: string;
  @Input() seeAllPath!: string;
  @Input() games: Game[] = [];

  visibleCount = 5;
  startIndex = 0;
  visibleGames: Game[] = [];

  constructor(private rawgService: RawgService, private router: Router) {}

  ngOnInit(): void {
    this.updateVisibleGames();
  }

  updateVisibleGames() {
    this.visibleGames = this.games.slice(
      this.startIndex,
      this.startIndex + this.visibleCount
    );

    this.visibleGames.forEach(game => {
      if (!game.imageLink) {
        this.rawgService.getImageByTitle(game.titolo).subscribe(img => {
          if (img) game.imageLink = img;
        });
      }
    });
  }

  next() {
    if (this.startIndex + this.visibleCount < this.games.length) {
      this.startIndex += this.visibleCount;
      this.updateVisibleGames();
    }
  }

  prev() {
    if (this.startIndex > 0) {
      this.startIndex -= this.visibleCount;
      this.updateVisibleGames();
    }
  }

  get isPrevDisabled() {
    return this.startIndex === 0;
  }

  get isNextDisabled() {
    return this.startIndex + this.visibleCount >= this.games.length;
  }

  trackById(index: number, game: Game): number {
    return game.id;
  }

  openSeeAll() {
    if(!this.seeAllPath) return;
    this.router.navigate([this.seeAllPath])
  }
}
