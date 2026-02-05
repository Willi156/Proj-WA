import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
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


      const storedUser = localStorage.getItem('datiUtente');

      if (!storedUser) {
        this.router.navigate(['/login']);
        return; // Fermiamo tutto qui.
      }

      try {
        this.user = JSON.parse(storedUser);
        if (this.user.id) this.userId = this.user.id;
        this.cd.detectChanges(); // Aggiorna la grafica SUBITO (risolve il flash)
      } catch(e) { console.error(e); }

      // 3. Verifichiamo col server che sia tutto vero
      this.connettiAlDatabase();
    }
  }

  connettiAlDatabase() {
    this.api.me().subscribe({
      next: (res: any) => {
        const dati = res.user || res;
        if (dati.id) this.userId = dati.id;
        this.user = dati;

        // Aggiorniamo i dati freschi
        localStorage.setItem('datiUtente', JSON.stringify(this.user));
        if (this.userId) localStorage.setItem('userId', this.userId.toString());

        this.impostaDati();
      },

      error: () => this.logout()
    });
  }


  logout() {
    // 1. Cancelliamo tutto
    localStorage.removeItem('datiUtente');
    localStorage.removeItem('userId');

    // 2. Puliamo la cache interna
    if (this.api.datiCache && this.api.clearCache) {
      this.api.clearCache();
    }

    // 3. Via al login
    this.router.navigate(['/login']);
  }

  impostaDati() {
    this.scaricaRecensioni();
    this.scaricaPreferiti();
  }

  scaricaRecensioni() {
    if (!this.userId) return;
    if (this.api.datiCache && this.api.datiCache.recensioni) {
      this.recensioniIds = this.api.datiCache.recensioni;
      this.cd.detectChanges();
      return;
    }
    this.api.getRecensioniByUserId(this.userId).subscribe({
      next: (recs: any[]) => {
        this.recensioniIds = recs.map(item => {
          const r = item.recensione || {};
          const c = item.contenuto || {};
          return {
            ...item,
            id: r.id || item.id,
            voto: r.voto || 0,
            testo: r.testo || '',
            titolo: c.Titolo || c.titolo || r.Titolo || r.titolo || ('Recensione ID: ' + r.id),
            tipo: c.tipo || 'N/A',
            isEditing: false
          };
        });
        if (this.api.datiCache) this.api.datiCache.recensioni = this.recensioniIds;
        this.cd.detectChanges();
      },
      error: (err) => console.error("Errore recupero recensioni:", err)
    });
  }

  scaricaPreferiti() {
    if (!this.userId) return;
    if (this.api.datiCache && this.api.datiCache.preferiti) {
      this.preferitiIds = this.api.datiCache.preferiti;
      this.cd.detectChanges();
      return;
    }
    this.api.getFavouriteMediaByUserIdComplete(this.userId).subscribe({
      next: (prefs) => {
        this.preferitiIds = prefs;
        if (this.api.datiCache) this.api.datiCache.preferiti = this.preferitiIds;
        this.cd.detectChanges();
      },
      error: (err) => console.error("Errore recupero preferiti:", err)
    });
  }

  setActiveTab(tabName: string) { this.activeTab = tabName; }

  rimuoviRecensione(rec: any) {
    const idReale = rec.recensione?.id || rec.id;
    if (!idReale) return;
    if (!rec.inEliminazione) {
      this.recensioniIds.forEach(r => r.inEliminazione = false);
      rec.inEliminazione = true;
      setTimeout(() => { rec.inEliminazione = false; this.cd.detectChanges(); }, 3000);
      return;
    }
    this.api.deleteRecensione(idReale).subscribe({
      next: () => {
        this.recensioniIds = this.recensioniIds.filter(r => (r.recensione?.id || r.id) !== idReale);
        if(this.api.datiCache) this.api.datiCache.recensioni = this.recensioniIds;
        this.cd.detectChanges();
      },
      error: (err) => alert(`Errore Server: Impossibile eliminare.`)
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
    this.api.removeMediaFromFavourites(this.userId, idContenuto).subscribe({
      next: () => {
        this.preferitiIds = this.preferitiIds.filter(p => p.id !== item.id);
        if(this.api.datiCache) this.api.datiCache.preferiti = this.preferitiIds;
        this.cd.detectChanges();
      },
      error: (err) => alert(`Errore Server: Impossibile rimuovere preferito.`)
    });
  }

  attivaModifica(rec: any) {
    rec.editVoto = rec.voto;
    rec.editTesto = rec.testo || rec.descrizione || '';
    rec.isEditing = true;
  }

  annullaModifica(rec: any) {
    rec.isEditing = false;
  }

  salvaModifica(rec: any) {
    const idReale = rec.id || (rec.recensione ? rec.recensione.id : null) || rec.idRecensione;
    if (!idReale) {
      alert("Errore: Impossibile identificare la recensione.");
      return;
    }
    const titoloInviato = rec.titolo || 'Recensione';
    this.api.updateRecensione(
      idReale, Number(rec.editVoto), rec.editTesto, titoloInviato, new Date()
    ).subscribe({
      next: (res) => {
        rec.voto = Number(rec.editVoto);
        rec.testo = rec.editTesto;
        rec.isEditing = false;
        this.cd.detectChanges();
      },
      error: (err) => alert("Errore nel salvataggio della modifica.")
    });
  }

  protected readonly empty = empty;
}
