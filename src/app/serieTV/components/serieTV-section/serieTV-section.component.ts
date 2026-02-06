import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SerieTv } from '../../model/serie-tv.model';
import { SerieTvCardComponent } from '../serieTV-card/serieTV-card.component';
import {Router} from '@angular/router';

@Component({
  selector: 'app-serie-section',
  standalone: true,
  imports: [CommonModule, SerieTvCardComponent],
  templateUrl: './serieTV-section.component.html',
  styleUrls: ['./serieTV-section.component.css']
})

export class SerieSectionComponent implements OnChanges, OnInit {
  constructor(private router: Router) {}

  @Input() seeAllPath!: string;
  @Input() title!: string;
  @Input() series: SerieTv[] = [];

  visibleCount = 5 ;
  startIndex = 0;
  visibleSeries: SerieTv[] = [];

  ngOnInit(): void {
    this.updateVisibleSeries(); // Aggiungi questa linea
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['series'] && this.series.length > 0) {
      this.startIndex = 0;
      this.updateVisibleSeries();
    }
  }

  updateVisibleSeries() {
    this.visibleSeries = this.series.slice(
      this.startIndex,
      this.startIndex + this.visibleCount
    );
  }

  next() {
    if (this.startIndex + this.visibleCount < this.series.length) {
      this.startIndex += this.visibleCount;
      this.updateVisibleSeries();
    }
  }

  prev() {
    if (this.startIndex > 0) {
      this.startIndex -= this.visibleCount;
      this.updateVisibleSeries();
    }
  }

  get isPrevDisabled() {
    return this.startIndex === 0;
  }

  get isNextDisabled() {
    return this.startIndex + this.visibleCount >= this.series.length;
  }

  trackById(index: number, serie: SerieTv): number {
    return serie.id;
  }

  openSeeAll() {
    if(!this.seeAllPath) return;
    this.router.navigate([this.seeAllPath])
  }

}
