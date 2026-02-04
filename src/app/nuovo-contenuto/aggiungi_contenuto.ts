import { Component, OnInit } from '@angular/core';
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
export class NuovoContenutoComponent implements OnInit {
  tipoSelezionato: string = '';
  listaPiattaformeApi: any[] = []; // Per le piattaforme dal DB

  nuovoContenuto: any = {
    titolo: '',
    anno: 2026,
    descrizione: '',
    genere: '',
    link: '',
    immagine: '',
    casaEditrice: '',
    casaProduttrice: '',
    piattaformeIds: [], // Useremo gli ID
    inCorso: false,
    stagioni: 1
  };

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.api.getPiattaformeWithIds().subscribe({
      next: (res) => {
        this.listaPiattaformeApi = res.filter(p => p.nome.toLowerCase() !== 'mobile');
      },
      error: (err) => console.error('Errore recupero piattaforme:', err)
    });
  }

  togglePiattaforma(id: number) {
    const index = this.nuovoContenuto.piattaformeIds.indexOf(id);
    if (index > -1) {
      this.nuovoContenuto.piattaformeIds.splice(index, 1);
    } else {
      this.nuovoContenuto.piattaformeIds.push(id);
    }
  }

  salvaContenuto() {
    if (this.tipoSelezionato === 'serie' && this.nuovoContenuto.stagioni < 1) {
      alert("Il numero di stagioni non può essere inferiore a 1!");
      return;
    }

    let tipoDb = this.tipoSelezionato.toUpperCase();
    if (tipoDb === 'SERIE') tipoDb = 'SERIE_TV';

    this.api.createContenuto(
      this.nuovoContenuto.titolo,
      this.nuovoContenuto.descrizione,
      this.nuovoContenuto.genere,
      this.nuovoContenuto.link,
      tipoDb,
      this.nuovoContenuto.anno,
      this.nuovoContenuto.immagine,
      this.tipoSelezionato === 'film' ? this.nuovoContenuto.casaProduttrice : undefined,
      this.tipoSelezionato === 'gioco' ? this.nuovoContenuto.casaEditrice : undefined,
      this.tipoSelezionato === 'serie' ? this.nuovoContenuto.inCorso : undefined,
      this.tipoSelezionato === 'serie' ? this.nuovoContenuto.stagioni : undefined,
      this.tipoSelezionato === 'gioco' ? this.nuovoContenuto.piattaformeIds : undefined
    ).subscribe({
      next: (res) => {
        alert("Contenuto aggiunto con successo! ID: " + res.id);
        this.router.navigate(['/user']);
      },
      error: (err) => alert("Errore nel salvataggio")
    });
  }
}
