import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-overlay-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overlay-details.html',
  styleUrl: './overlay-details.css',
})
export class OverlayDetails {

  // 🔹 stato apertura
  @Input() open = false;

  // 🔹 contenuto selezionato (film / serie / gioco)
  @Input() content: any = null;

  // 🔹 eventi verso la home
  @Output() closed = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() submitReview = new EventEmitter<any>();

  close() {
    this.closed.emit();
  }
}
