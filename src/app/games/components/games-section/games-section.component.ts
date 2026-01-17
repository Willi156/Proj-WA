import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameCardComponent } from '../game-card.component';

@Component({
  selector: 'app-games-section',
  standalone: true,
  imports: [CommonModule, GameCardComponent],
  templateUrl: './games-section.component.html',
  styleUrls: ['./games-section.component.css']
})
export class GamesSectionComponent {

  @Input() title!: string;
  @Input() games: any[] = [];

  @ViewChild('scrollContainer')
  scrollContainer!: ElementRef<HTMLDivElement>;

  scrollLeft() {
    this.scrollContainer.nativeElement.scrollLeft -= 220 * 5;
  }

  scrollRight() {
    this.scrollContainer.nativeElement.scrollLeft += 220 * 5;
  }
}
