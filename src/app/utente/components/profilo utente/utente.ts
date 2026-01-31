import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { empty } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-utente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './utente.html',
  styleUrl: './utente.css'
})
export class UtenteComponent implements OnInit {

  userId = 0;
  preferitiIds: any[] = [];
  recensioniIds: any[] = [];

  user: any = { nome: '', cognome: '', username: '', email: '', immagineProfilo: '' };
  activeTab: string = 'games';
  searchText: string = '';
  saluto: string = 'Bentornat*';

  constructor(
    private api: ApiService,
    private cd: ChangeDetectorRef,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    const ora = new Date().getHours();
    this.saluto = (ora >= 6 && ora < 18) ? 'Buongiorno' : 'Buonasera';

    if (isPlatformBrowser(this.platformId)) {
      this.connettiAlDatabase();
    }
  }

  connettiAlDatabase() {
    this.api.me().subscribe({
      next: (res:any) => {
        const dati = res.user || res;
        if (dati.id) this.userId = dati.id;
        this.user = dati;

        localStorage.setItem('datiUtente', JSON.stringify(this.user));
        localStorage.setItem('userId', this.userId.toString());

        setTimeout(() => { this.impostaDati(); }, 1000);
      },
      error: () => this.router.navigate(["/login"])
    });
      }

  impostaDati() {
    this.scaricaRecensioni();
    this.scaricaPreferiti();
    this.cd.detectChanges();
  }

  scaricaRecensioni() {
    this.api.getRecensioniByUserId(this.userId).subscribe({
      next: (recs) => {
        this.recensioniIds = recs;
        this.cd.detectChanges();
      }
    });
  }

  scaricaPreferiti() {
    this.api.getFavouriteMediaByUserIdComplete(this.userId).subscribe({
      next: (prefs) => {
        this.preferitiIds = prefs;
        this.cd.detectChanges();
      }
    });
  }

  setActiveTab(tabName: string) { this.activeTab = tabName; }

  rimuoviRecensione(rec: any) {
    const idReale = rec.recensione?.id || rec.id;
    if (!idReale) {  return; }

    if (!rec.inEliminazione) {
      this.recensioniIds.forEach(r => r.inEliminazione = false);
      rec.inEliminazione = true;
      setTimeout(() => { rec.inEliminazione = false; this.cd.detectChanges(); }, 3000);
      return;
    }

    this.api.me().pipe(
      switchMap(() => this.api.deleteRecensione(idReale))
    ).subscribe({
      next: () => {
        this.recensioniIds = this.recensioniIds.filter(r => (r.recensione?.id || r.id) !== idReale);
        this.cd.detectChanges();
      },
      error: (err) => {
        alert(`Errore Server: ${err.status} - Impossibile eliminare.`);
      }
    });
  }

  rimuoviPreferito(item: any) {
    const idContenuto = item.id;
    if (!idContenuto) return;

    if (!item.inEliminazione) {
      this.preferitiIds.forEach(p => p.inEliminazione = false);
      item.inEliminazione = true;
      setTimeout(() => { item.inEliminazione = false; this.cd.detectChanges(); }, 3000);
      return;
    }

    this.api.me().pipe(
      switchMap(() => this.api.removeMediaFromFavourites(this.userId, idContenuto))
    ).subscribe({
      next: () => {
        this.preferitiIds = this.preferitiIds.filter(p => p.id !== item.id);
        this.cd.detectChanges();
      },
      error: (err) => {
        alert(`Errore Server: ${err.status} - Impossibile rimuovere.`);
      }
    });
  }

  protected readonly empty = empty;
}
