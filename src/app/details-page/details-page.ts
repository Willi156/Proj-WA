import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { findMockContent, MockContent, MockKind } from '../mock/dati-mock-sample';

@Component({
  selector: 'app-details-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './details-page.html',
  styleUrl: './details-page.css',
})
export class DetailsPageComponent {
  loading = true;
  error = '';

  kind: MockKind = 'GAME';
  id = 0;

  content: MockContent | null = null;

  constructor(private route: ActivatedRoute) {
    this.route.paramMap.subscribe((p) => {
      this.kind = (p.get('kind') as MockKind) ?? 'GAME';
      this.id = Number(p.get('id') ?? 0);

      // Mock load
      this.loading = true;
      this.error = '';
      const found = findMockContent(this.kind, this.id);

      this.content = found;
      this.loading = false;

      if (!found) {
        this.error = 'Contenuto non trovato (mock).';
      }
    });
  }
}
