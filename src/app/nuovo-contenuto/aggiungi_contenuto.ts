import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-nuovo-contenuto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './aggiungi_contenuto.html',
  styleUrl: './aggiungi_contenuto.css'
})
export class NuovoContenutoComponent implements OnInit {
  tipoSelezionato: string = '';
  listaPiattaformeApi: any[] = [];
  idModifica: number | null = null;
  successMessage: string = ''; // Variabile per il banner verde

  nuovoContenuto: any = {
    titolo: '',
    anno: 2026,
    descrizione: '',
    genere: '',
    link: '',
    immagine: '',
    casaEditrice: '',
    casaProduttrice: '',
    piattaformeIds: [],
    inCorso: false,
    stagioni: 1
  };

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.api.getPiattaformeWithIds().subscribe({
      next: (res) => this.listaPiattaformeApi = res.filter(p => p.nome.toLowerCase() !== 'mobile')
    });

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.idModifica = +id;
      this.caricaDatiDaMemoriaLocale();
    }
  }

  caricaDatiDaMemoriaLocale() {
    const datiSalvafi = localStorage.getItem('contenutoDaModificare');

    if (!datiSalvafi) {
      this.router.navigate(['/admin/gestione']);
      return;
    }

    const dati = JSON.parse(datiSalvafi);

    // Mappiamo il tipo per il frontend (il select box)
    if (dati.tipo === 'SERIE_TV' || dati.tipo === 'SERIE TV') {
      this.tipoSelezionato = 'serie';
    } else if (dati.tipo === 'GIOCO' || dati.tipo === 'GAME') {
      this.tipoSelezionato = 'gioco';
    } else {
      this.tipoSelezionato = 'film';
    }

    this.nuovoContenuto = {
      titolo: dati.titolo,
      anno: dati.annoPubblicazione,
      descrizione: dati.descrizione,
      genere: dati.genere,
      link: dati.link,
      immagine: dati.imageLink || dati.immagine,
      casaEditrice: dati.casaEditrice,
      casaProduttrice: dati.casaProduzione || dati.casaProduttrice,
      // Se le piattaforme arrivano come oggetti, prendiamo solo gli ID
      piattaformeIds: dati.piattaforme ? dati.piattaforme.map((p: any) => p.id || p) : [],
      inCorso: dati.inCorso,
      stagioni: dati.stagioni || 1
    };
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
    // 1. PREPARIAMO IL TIPO ESATTO (Come vuole William nello screen)
    let tipoDb = this.tipoSelezionato.toUpperCase();

    if (this.tipoSelezionato === 'serie') {
      tipoDb = 'SERIE_TV';
    } else if (this.tipoSelezionato === 'gioco') {
      tipoDb = 'GIOCO'; // Rimettiamo GIOCO come da tua richiesta
    } else {
      tipoDb = 'FILM';
    }

    localStorage.removeItem('contenutoDaModificare');

    const gestisciSuccesso = (messaggio: string) => {
      this.successMessage = messaggio;
      setTimeout(() => {
        this.router.navigate(['/admin/gestione']);
      }, 2000);
    };

    // 2. PULIZIA DATI (Fondamentale per evitare crash 500)

    // Se è un gioco, mandiamo gli ID delle piattaforme. Se no, array vuoto.
    const piattaformeSafe = (this.tipoSelezionato === 'gioco') ? this.nuovoContenuto.piattaformeIds : [];

    // Campi esclusivi: mandiamo NULL se non servono (non undefined)
    const casaProdSafe = (this.tipoSelezionato === 'film') ? this.nuovoContenuto.casaProduttrice : null;
    const casaEditriceSafe = (this.tipoSelezionato === 'gioco') ? this.nuovoContenuto.casaEditrice : null;

    const inCorsoSafe = (this.tipoSelezionato === 'serie') ? (!!this.nuovoContenuto.inCorso) : false;
    const stagioniSafe = (this.tipoSelezionato === 'serie') ? (Number(this.nuovoContenuto.stagioni) || 1) : 0;

    console.log("INVIO AL SERVER:", { id: this.idModifica, tipo: tipoDb, piattaforme: piattaformeSafe });

    if (this.idModifica) {
      this.api.updateContenuto(
        this.idModifica,
        this.nuovoContenuto.titolo,
        this.nuovoContenuto.descrizione,
        this.nuovoContenuto.genere,
        this.nuovoContenuto.link,
        tipoDb,
        this.nuovoContenuto.anno,
        this.nuovoContenuto.immagine,
        casaProdSafe,
        casaEditriceSafe,
        inCorsoSafe,
        stagioniSafe,
        piattaformeSafe
      ).subscribe({
        next: () => gestisciSuccesso("Modifica salvata con successo!"),
        error: (err) => {
          console.error("ERRORE SERVER:", err);
          // Se crasha ancora qui, è colpa del backend che non gestisce l'array piattaformeSafe
          alert("Errore 500: Il server ha rifiutato i dati (probabilmente le piattaforme).");
        }
      });

    } else {
      this.api.createContenuto(
        this.nuovoContenuto.titolo,
        this.nuovoContenuto.descrizione,
        this.nuovoContenuto.genere,
        this.nuovoContenuto.link,
        tipoDb,
        this.nuovoContenuto.anno,
        this.nuovoContenuto.immagine,
        casaProdSafe,
        casaEditriceSafe,
        inCorsoSafe,
        stagioniSafe,
        piattaformeSafe
      ).subscribe({
        next: () => gestisciSuccesso("Nuovo contenuto creato!"),
        error: (err) => {
          console.error(err);
          alert("Errore durante la creazione.");
        }
      });
    }
  }
}
