import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nuovo-contenuto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './aggiungi_contenuto.html',
  styleUrl: './aggiungi_contenuto.css'
})
export class NuovoContenutoComponent {
  tipoSelezionato: string = '';

  nuovoContenuto: any = {
    titolo: '',
    anno: 2026,
    descrizione: '',
    genere: '',
    link: '',
    casaEditrice: '',
    casaProduttrice: '',
    piattaforme: [],
    inCorso: false,
    stagioni: 1
  };

  listaPiattaforme: string[] = ['PC', 'PS5', 'Xbox', 'Switch'];

  constructor(private api: ApiService, private router: Router) {}

  togglePiattaforma(p: string) {
    const index = this.nuovoContenuto.piattaforme.indexOf(p);
    if (index > -1) {
      this.nuovoContenuto.piattaforme.splice(index, 1);
    } else {
      this.nuovoContenuto.piattaforme.push(p);
    }
  }

  salvaContenuto() {
    if (this.tipoSelezionato === 'serie' && this.nuovoContenuto.stagioni < 1) {
      alert("Il numero di stagioni non può essere inferiore a 1!");
      return;
    }

    this.api.addContenuto(this.nuovoContenuto, this.tipoSelezionato).subscribe({
      next: () => {
        alert("Contenuto aggiunto con successo!");
        this.router.navigate(['/user']);
      },
      error: (err) => alert("Errore nel salvataggio")
    });
  }
}
