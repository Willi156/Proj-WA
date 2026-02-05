import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-nuovo-contenuto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './aggiungi_contenuto.html', // Controlla che il nome del file sia giusto
  styleUrl: './aggiungi_contenuto.css'
})
export class NuovoContenutoComponent implements OnInit {
  tipoSelezionato: string = '';
  listaPiattaformeApi: any[] = [];
  idModifica: number | null = null; // Se diverso da null, siamo in modifica!

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
    private route: ActivatedRoute // <--- Ci serve per capire su che pagina siamo
  ) {}

  ngOnInit() {
    // 1. Carichiamo le piattaforme (sempre utile)
    this.api.getPiattaformeWithIds().subscribe({
      next: (res) => this.listaPiattaformeApi = res.filter(p => p.nome.toLowerCase() !== 'mobile')
    });

    // 2. CONTROLLO MAGICO: C'è un ID nell'indirizzo?
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      // SIAMO IN MODALITÀ MODIFICA!
      this.idModifica = +id;
      console.log("Modalità Modifica attivata per ID:", this.idModifica);
      this.caricaDatiPerModifica(this.idModifica);
    }
  }

  caricaDatiPerModifica(id: number) {
    this.api.getContenutoById(id).subscribe({
      next: (dati) => {
        // Riempiamo il modulo con i dati scaricati
        console.log("Dati scaricati:", dati);

        this.tipoSelezionato = dati.tipo.toLowerCase() === 'serie_tv' ? 'serie' : dati.tipo.toLowerCase();

        this.nuovoContenuto = {
          titolo: dati.titolo,
          anno: dati.annoPubblicazione,
          descrizione: dati.descrizione,
          genere: dati.genere,
          link: dati.link,
          immagine: dati.imageLink || dati.immagine,
          casaEditrice: dati.casaEditrice,
          casaProduttrice: dati.casaProduzione, // Attenzione al nome del campo nel DB
          piattaformeIds: dati.piattaforme ? dati.piattaforme.map((p: any) => p.id) : [],
          inCorso: dati.inCorso,
          stagioni: dati.stagioni || 1
        };
      },
      error: (err) => alert("Errore nel caricamento dei dati da modificare.")
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
    const tipoDb = this.tipoSelezionato === 'serie' ? 'SERIE_TV' : this.tipoSelezionato.toUpperCase();

    if (this.idModifica) {
      // --- LOGICA DI AGGIORNAMENTO (UPDATE) ---
      this.api.updateContenuto(
        this.idModifica,
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
        next: () => {
          alert("Modifica salvata con successo!");
          this.router.navigate(['/admin/gestione']);
        },
        error: (err) => {
          console.error(err);
          alert("Errore durante la modifica.");
        }
      });

    } else {
      // --- LOGICA DI CREAZIONE (NUOVO) ---
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
        next: () => {
          alert("Nuovo contenuto creato!");
          this.router.navigate(['/admin/gestione']);
        },
        error: () => alert("Errore durante la creazione.")
      });
    }
  }
}
