import { Component, ElementRef, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaItem } from '../../../../shared/models/media-item';
import { MediaCardComponent } from '../media-card/media-card';

@Component({
  selector: 'app-carousel-section',
  standalone: true,
  imports: [CommonModule, MediaCardComponent],
  templateUrl: './carousel-section.html',
  styleUrl: './carousel-section.css',
})
export class CarouselSectionComponent {
  @Input() title = '';
  @Input() category = '';
  @Input() label = '';
  @Input() items: MediaItem[] = [];

  // ✅ nuovo: emette item + index quando clicchi una card
  @Output() itemClick = new EventEmitter<{ item: MediaItem; index: number }>();

  @ViewChild('track') track?: ElementRef<HTMLDivElement>;

  private getTrack(): HTMLDivElement | null {
    return this.track?.nativeElement ?? null;
  }

  scrollLeft() {
    const el = this.getTrack();
    if (!el) return;
    el.scrollBy({ left: -700, behavior: 'smooth' });
  }

  scrollRight() {
    const el = this.getTrack();
    if (!el) return;
    el.scrollBy({ left: 700, behavior: 'smooth' });
  }

  activeArrow: 'left' | 'right' | null = null;

  setActive(dir: 'left' | 'right') {
    this.activeArrow = dir;
  }
}
