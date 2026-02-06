import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { RouterLink, Router } from '@angular/router'; // Aggiungi Router qui
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
    private cd: ChangeDetectorRef,
    private router: Router // Serve per navigare via codice
  ) {}

  ngOnInit() {
    this.caricaContenuti();
  }

  caricaContenuti() {
    this.api.getContenuti().subscribe({
      next: (res) => {
        this.contenuti = res.map(item => ({ ...item, inEliminazione: false }));
        this.cd.detectChanges();
      },
      error: (err) => console.error("Errore caricamento", err)
    });
  }

  get contenutiFiltrati() {
    if (!this.searchText) {
      return this.contenuti;
    }
    return this.contenuti.filter(item =>
      item.titolo.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  vaiAModifica(item: any) {
    localStorage.setItem('contenutoDaModificare', JSON.stringify(item));

    this.router.navigate(['/modifica-contenuto', item.id]);
  }

  elimina(item: any) {
    if (!item.inEliminazione) {
      this.contenuti.forEach(c => c.inEliminazione = false);
      item.inEliminazione = true;
      setTimeout(() => {
        item.inEliminazione = false;
        this.cd.detectChanges();
      }, 3000);
      return;
    }

    this.api.deleteContenutoById(item.id).subscribe({
      next: () => {
        this.caricaContenuti();
      },
      error: (err) => {
        console.error("Errore eliminazione:", err);
        item.inEliminazione = false;
      }
    });
  }
}
