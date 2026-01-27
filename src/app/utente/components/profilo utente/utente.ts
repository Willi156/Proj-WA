import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { empty } from 'rxjs';

@Component({
  selector: 'app-utente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './utente.html',
  styleUrl: './utente.css'
})
export class UtenteComponent implements OnInit {


  readonly USER = 'WIMAn';
  readonly PASS = '1234567!';


  userId = 0;
  preferitiIds: any[] = [];
  recensioniIds: any[] = [];

  user = {
    nome: '',
    cognome: '',
    username: '',
    email: '',
    immagineProfilo: ''
  };

  activeTab: string = 'games';
  searchText: string = '';
  saluto: string = 'Bentornat*';

  constructor(
    private api: ApiService,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    const ora = new Date().getHours();
    this.saluto = (ora >= 6 && ora < 18) ? 'Buongiorno' : 'Buonasera';

    // Cache per caricamento istantaneo
    if (isPlatformBrowser(this.platformId)) {
      const datiLocali = localStorage.getItem('datiUtente');
      if (datiLocali) {
        this.user = JSON.parse(datiLocali);
        if (localStorage.getItem('userId')) this.userId = parseInt(localStorage.getItem('userId')!);
      }
    }

    this.connettiAlDatabase();
  }

  connettiAlDatabase() {
    this.api.authenticate(this.USER, this.PASS).subscribe({
      next: (res) => {
        this.impostaDati(res);
      },

    });
  }

  impostaDati(data: any) {
    if (!data) return;
    const dati = data.user || data;

    if (dati.id) this.userId = dati.id;

    this.user = {
      nome: dati.nome || this.user.nome || 'Utente',
      cognome: dati.cognome || this.user.cognome || '',
      username: dati.username || this.user.username || '',
      email: dati.email || this.user.email || '',
      immagineProfilo: dati.immagineProfilo || this.user.immagineProfilo
    };

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('datiUtente', JSON.stringify(this.user));
      localStorage.setItem('userId', this.userId.toString());
    }

    if (dati.recensioni) this.recensioniIds = dati.recensioni;
    else if (this.userId > 0) this.scaricaRecensioni();

    if (dati.preferiti) this.preferitiIds = dati.preferiti;
    else if (this.userId > 0) this.scaricaPreferiti();

    this.cd.detectChanges();
  }

  scaricaRecensioni() {
    this.api.getRecensioniByUserId(this.userId).subscribe({
      next: (recs) => { this.recensioniIds = recs; this.cd.detectChanges(); },
      error: () => {}
    });
  }

  scaricaPreferiti() {
    this.api.getFavouriteMediaByUserIdComplete(this.userId).subscribe({
      next: (prefs) => { this.preferitiIds = prefs; this.cd.detectChanges(); },
      error: () => {}
    });
  }

  setActiveTab(tabName: string) { this.activeTab = tabName; }
  rimuoviRecensione(rec: any) { /* logica rimozione */ }
  rimuoviPreferito(item: any) { /* logica rimozione */ }
  protected readonly empty = empty;
}
