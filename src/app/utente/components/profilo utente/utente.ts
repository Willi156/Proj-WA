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
  userId = 2;
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
    if (ora >= 6 && ora < 18) {
      this.saluto = 'Buongiorno';
    } else {
      this.saluto = 'Buonasera';
    }

    this.api.authenticate('WIMAn', '123456!').subscribe({
      next: (response) => {
        if (response) {
          if (response.id) this.userId = response.id;

          const datiReali = response.user || response;

          this.user = {
            nome: datiReali.nome || 'Nome Assente',
            cognome: datiReali.cognome || '',
            username: datiReali.username || '',
            email: datiReali.email || '',
            immagineProfilo: datiReali.immagineProfilo || ''
          };

          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('datiUtente', JSON.stringify(this.user));
            localStorage.setItem('userId', this.userId.toString());
          }

          if (datiReali.recensioni) {
            this.recensioniIds = datiReali.recensioni;
          }
          this.cd.detectChanges();
        }
        this.caricaDati();
      },
      error: (error) => { console.error(error); }
    });
  }

  caricaDati() {
    this.api.getCurrentUserInfo().subscribe({
      next: (userInfo) => {
        if (userInfo && userInfo.recensioni) {
          this.recensioniIds = userInfo.recensioni;
          this.cd.detectChanges();
        }
      },
      error: () => { }
    });

    this.api.getFavouriteMediaByUserIdComplete(this.userId).subscribe({
      next: (result: any[]) => {
        this.preferitiIds = result;
        this.cd.detectChanges();
      },
      error: () => { }
    });
  }

  setActiveTab(tabName: string) {
    this.activeTab = tabName;
  }

  rimuoviRecensione(rec: any) {
    if (!rec.inEliminazione) {
      rec.inEliminazione = true;
      setTimeout(() => {
        rec.inEliminazione = false;
        this.cd.detectChanges();
      }, 3000);
      return;
    }

    this.recensioniIds = this.recensioniIds.filter(r => r !== rec);
    this.cd.detectChanges();
  }

  rimuoviPreferito(item: any) {
    if (!item.inEliminazione) {
      item.inEliminazione = true;
      setTimeout(() => {
        item.inEliminazione = false;
        this.cd.detectChanges();
      }, 3000);
      return;
    }

    this.preferitiIds = this.preferitiIds.filter(p => p !== item);
    this.cd.detectChanges();
  }

  protected readonly empty = empty;
}
