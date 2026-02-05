import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // AGGIUNTO ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service'; // Controlla che il percorso sia '../services/api.service' o '../../services/api.service' a seconda delle cartelle
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gestione-contenuti',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './gestione-contenuti.component.html',
  styleUrl: './gestione-contenuti.component.css'
})
export class GestioneContenutiComponent implements OnInit {
  contenuti: any[] = [];
  searchText: string = '';

  constructor(
    private api: ApiService,
    private cd: ChangeDetectorRef // INIEZIONE PER AGGIORNAMENTO GRAFICO
  ) {}

  ngOnInit() {
    this.caricaContenuti();
  }

  caricaContenuti() {
    this.api.getContenuti().subscribe({
      next: (res) => {
        this.contenuti = res;
        this.cd.detectChanges(); // MAGIA: Forza la grafica ad aggiornarsi SUBITO
      },
      error: (err) => console.error("Errore caricamento", err)
    });
  }

  // Filtro di ricerca in tempo reale
  get contenutiFiltrati() {
    if (!this.searchText) {
      return this.contenuti;
    }
    return this.contenuti.filter(item =>
      item.titolo.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  // Funzione ELIMINA collegata all'API
  elimina(id: number) {
    if (confirm('Sei sicuro di voler eliminare questo contenuto?')) {
      this.api.deleteContenutoById(id).subscribe({
        next: () => {
          alert("Contenuto eliminato con successo!");
          this.caricaContenuti(); // Ricarica la lista aggiornata
        },
        error: (err) => alert("Errore durante l'eliminazione: " + err.message)
      });
    }
  }
}
