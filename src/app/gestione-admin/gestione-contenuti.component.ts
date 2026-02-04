import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-gestione-contenuti',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './gestione-contenuti.component.html',
  styleUrl: './gestione-contenuti.component.css'
})
export class GestioneContenutiComponent implements OnInit {
  contenuti: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.caricaContenuti();
  }

  caricaContenuti() {
    this.api.getContenuti().subscribe({
      next: (res) => this.contenuti = res,
      error: (err) => console.error("Errore nel caricamento contenuti", err)
    });
  }

  elimina(id: number) {
    if (confirm('Sei sicuro di voler eliminare questo contenuto?')) {
      // Nota: Assicurati che il metodo deleteContenuto esista nel tuo api.service.ts
      // this.api.deleteContenuto(id).subscribe(() => this.caricaContenuti());
    }
  }
}
