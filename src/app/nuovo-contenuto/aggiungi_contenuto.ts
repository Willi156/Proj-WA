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

  successMessage: string = '';

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
  ) {
  }

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

    this.tipoSelezionato = dati.tipo.toLowerCase() === 'serie_tv' ? 'serie' : dati.tipo.toLowerCase();

    this.nuovoContenuto = {
      titolo: dati.titolo,
      anno: dati.annoPubblicazione,
      descrizione: dati.descrizione,
      genere: dati.genere,
      link: dati.link,
      immagine: dati.imageLink || dati.immagine,
      casaEditrice: dati.casaEditrice,
      casaProduttrice: dati.casaProduzione || dati.casaProduttrice,
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
    const tipoDb = this.tipoSelezionato === 'serie' ? 'SERIE_TV' : this.tipoSelezionato.toUpperCase();


    localStorage.removeItem('contenutoDaModificare');


    const gestisciSuccesso = (messaggio: string) => {
      this.successMessage = messaggio;
      setTimeout(() => {
        this.router.navigate(['/admin/gestione']);
      }, 2000);
    };

    const piattaformeSafe = (this.tipoSelezionato === 'gioco' || this.tipoSelezionato === 'game')
      ? this.nuovoContenuto.piattaformeIds
      : [];

    const casaProdSafe = this.tipoSelezionato === 'film' ? this.nuovoContenuto.casaProduttrice : null;
    const casaEditriceSafe = (this.tipoSelezionato === 'gioco' || this.tipoSelezionato === 'game') ? this.nuovoContenuto.casaEditrice : null;
    const inCorsoSafe = this.tipoSelezionato === 'serie' ? this.nuovoContenuto.inCorso : false;
    const stagioniSafe = this.tipoSelezionato === 'serie' ? this.nuovoContenuto.stagioni : 0;

    console.log("STO INVIANDO AL SERVER:", {
      id: this.idModifica,
      titolo: this.nuovoContenuto.titolo,
      tipo: tipoDb,
      piattaforme: piattaformeSafe,
      casaProd: casaProdSafe,
      casaEd: casaEditriceSafe
    });

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
          alert("Errore 500: Il server ha rifiutato i dati. Controlla la console per i dettagli.");
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
