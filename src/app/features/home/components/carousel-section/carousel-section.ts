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
export class CarouselSectionComponent<T extends MediaItem = MediaItem> {
  @Input() title = '';
  @Input() category = '';
  @Input() label = '';

  // ✅ ora accetta anche MediaItemWithRaw[] (o qualsiasi estensione di MediaItem)
  @Input() items: T[] = [];

  // ✅ emette lo stesso tipo T (quindi raw NON si perde)
  @Output() itemClick = new EventEmitter<{ item: T; index: number }>();

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

  // ✅ chiamalo dal template quando clicchi una card
  onCardClick(item: T, index: number) {
    this.itemClick.emit({ item, index });
  }

  // ✅ opzionale: trackBy per prestazioni
  trackById = (_: number, it: T) => it.id;
}
