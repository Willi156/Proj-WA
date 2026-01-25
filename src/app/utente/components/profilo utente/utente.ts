import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  constructor(private api: ApiService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
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

          if (datiReali.recensioni) {
            this.recensioniIds = datiReali.recensioni;
          }

          this.cd.detectChanges();
        }

        this.caricaDati();
      },
      error: (error) => {
        console.error(error);
      }
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

  protected readonly empty = empty;
}
