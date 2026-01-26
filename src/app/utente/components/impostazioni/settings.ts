import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './settings.html',
})
export class SettingsComponent implements OnInit {

  user = {
    nome: '',
    cognome: '',
    username: '',
    email: '',
    immagineProfilo: '' // <--- AGGIUNTO: Serve per salvare l'avatar
  };

  vecchiaPassword: string = '';
  nuovaPassword: string = '';
  confermaPassword: string = '';

  messaggioSuccesso: string = '';
  messaggioErrore: string = '';


  listaAvatar: string[] = [];
  mostraSelettoreAvatar: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    this.generaListaAvatar();

    if (isPlatformBrowser(this.platformId)) {
      const datiSalvati = localStorage.getItem('datiUtente');
      if (datiSalvati) {
        const datiObj = JSON.parse(datiSalvati);
        this.user.nome = datiObj.nome || '';
        this.user.cognome = datiObj.cognome || '';
        this.user.username = datiObj.username || '';
        this.user.email = datiObj.email || '';

        this.user.immagineProfilo = datiObj.immagineProfilo || '';
      }
    }
  }

  generaListaAvatar() {
    for (let i = 1; i <= 50; i++) {
      this.listaAvatar.push(`https://api.dicebear.com/7.x/bottts/svg?seed=${i}`);
    }
  }

  selezionaAvatar(url: string) {
    this.user.immagineProfilo = url;
    this.mostraSelettoreAvatar = false;
  }

  salva() {
    this.messaggioErrore = '';
    this.messaggioSuccesso = '';

    if (this.nuovaPassword || this.confermaPassword) {
      if (!this.vecchiaPassword) {
        this.mostraErrore("Devi inserire la vecchia password per cambiarla.");
        return;
      }
      if (this.nuovaPassword !== this.confermaPassword) {
        this.mostraErrore("Le nuove password non coincidono!");
        return;
      }
    }

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('datiUtente', JSON.stringify(this.user));
    }

    this.mostraSuccesso("Profilo e Avatar aggiornati con successo!");

    this.vecchiaPassword = '';
    this.nuovaPassword = '';
    this.confermaPassword = '';
  }

  mostraErrore(msg: string) {
    this.messaggioErrore = msg;
    setTimeout(() => { this.messaggioErrore = ''; }, 4000);
  }

  mostraSuccesso(msg: string) {
    this.messaggioSuccesso = msg;
    setTimeout(() => { this.messaggioSuccesso = ''; }, 3000);
  }
}
