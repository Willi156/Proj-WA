import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import {
  MockContent,
  MockKind,
  MockReview,
  findMockContent,
} from '../mock/dati-mock-sample'; // <-- cambia path se diverso

type OpenSection = 'trailer' | 'write' | 'list' | null;

@Component({
  selector: 'app-details-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './details-page.html',
  styleUrl: './details-page.css',
})
export class DetailsPageComponent {
  loading = true;
  error = '';

  kind: MockKind = 'GAME';
  id = 0;
  whereText = '—';

  content: MockContent | null = null;
  reviews: MockReview[] = [];

  // UI serie (mock)
  seasons: { id: number; name: string }[] = [];
  selectedSeasonId = 1;

  // Accordion
  openSection: OpenSection = null;

  // Trailer (placeholder)
  trailerEmbed?: SafeResourceUrl;

  // Form recensione
  scores = [1,2,3,4,5,6,7,8,9,10];
  reviewDraft: { user: string; rating: number; comment: string } = {
    user: '',
    rating: 8,
    comment: '',
  };

  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    const kindParam = (this.route.snapshot.paramMap.get('kind') || 'GAME').toUpperCase();
    const idParam = this.route.snapshot.paramMap.get('id') || '0';

    this.kind = (['GAME', 'MOVIE', 'SERIES'] as MockKind[]).includes(kindParam as MockKind)
      ? (kindParam as MockKind)
      : 'GAME';

    this.id = Number(idParam) || 0;

    this.loadFromMock();
  }

  private loadFromMock() {
    this.loading = true;
    this.error = '';

    const found = findMockContent(this.kind, this.id);
    if (!found) {
      this.content = null;
      this.reviews = [];
      this.error = 'Contenuto non trovato.';
      this.loading = false;
      return;
    }

    this.content = found;
    this.reviews = [...found.reviews];

    this.whereText = this.kind === 'GAME'
      ? 'Acquistabile su: Steam / PlayStation Store / Amazon (placeholder)'
      : 'Disponibile su: Netflix / Prime Video / Disney+ (placeholder)';
    // Stagioni solo se SERIES (mock UI)
    if (this.kind === 'SERIES') {
      // se vuoi, puoi basarti su id per avere numeri diversi
      this.seasons = [
        { id: 1, name: 'Stagione 1' },
        { id: 2, name: 'Stagione 2' },
        { id: 3, name: 'Stagione 3' },
      ];
      this.selectedSeasonId = 1;
    } else {
      this.seasons = [];
    }

    // Trailer placeholder (poi lo colleghiamo ai mock)
    const yt = 'https://www.youtube.com/embed/QkkoHAzjnUs?si=L82vHthTHmd3MDka';
    this.trailerEmbed = this.sanitizer.bypassSecurityTrustResourceUrl(yt);

    this.loading = false;
  }

  // Accordion: uno aperto alla volta
  onToggle(section: Exclude<OpenSection, null>, ev: Event) {
    const details = ev.target as HTMLDetailsElement;
    if (details.open) this.openSection = section;
    else if (this.openSection === section) this.openSection = null;
  }

  onSeasonChange() {
    // qui in futuro puoi filtrare recensioni/episodi per stagione
  }

  submitReview() {
    const user = this.reviewDraft.user.trim();
    const comment = this.reviewDraft.comment.trim();
    const rating = Number(this.reviewDraft.rating);

    if (!user || !comment || !(rating >= 1 && rating <= 10)) return;

    const today = this.formatDateDDMMYYYY(new Date());

    const newReview: MockReview = { user, rating, comment, date: today };
    this.reviews = [newReview, ...this.reviews];

    // aggiorno anche il mock in memoria del dettaglio (solo runtime)
    if (this.content) {
      this.content.reviews = this.reviews;
    }

    this.resetDraft();
    this.openSection = 'list';
  }

  resetDraft() {
    this.reviewDraft = { user: '', rating: 8, comment: '' };
  }

  private formatDateDDMMYYYY(d: Date) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  }
}
