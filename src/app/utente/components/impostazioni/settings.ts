import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './settings.html',
})
export class SettingsComponent implements OnInit {

  readonly USER = 'WIMAn';
  PASS = '1234567!';

  user = { nome: '', cognome: '', username: '', email: '', immagineProfilo: '' };
  userId: number = 0;

  vecchiaPassword: string = '';
  nuovaPassword: string = '';
  confermaPassword: string = '';

  messaggioSuccesso: string = '';
  messaggioErrore: string = '';
  listaAvatar: string[] = [];
  mostraSelettoreAvatar: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private api: ApiService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.generaListaAvatar();
    if (isPlatformBrowser(this.platformId)) {
      const idSalvato = localStorage.getItem('userId');
      if (idSalvato) this.userId = parseInt(idSalvato);

      const datiSalvati = localStorage.getItem('datiUtente');
      if (datiSalvati) {
        this.user = { ...this.user, ...JSON.parse(datiSalvati) };
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

    if (!this.userId) {
      this.mostraErrore("Errore: ID utente mancante.");
      return;
    }

    this.api.authenticate(this.USER, this.PASS).subscribe({
      next: () => {
        this.eseguiUpdate();
      },
      error: () => this.mostraErrore("Errore di connessione al server.")
    });
  }

  eseguiUpdate() {
    if (this.nuovaPassword || this.confermaPassword) {
      if (!this.vecchiaPassword) {
        this.mostraErrore("Devi inserire la vecchia password.");
        return;
      }
      if (this.nuovaPassword !== this.confermaPassword) {
        this.mostraErrore("Le nuove password non coincidono.");
        return;
      }
    }

    this.api.updateUserInfo(
      this.userId,
      this.user.nome,
      this.user.cognome,
      this.user.email,
      this.user.immagineProfilo
    ).subscribe({
      next: () => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('datiUtente', JSON.stringify(this.user));
        }

        if (this.nuovaPassword) {
          this.gestisciCambioPassword();
        } else {
          this.mostraSuccesso("Profilo aggiornato con successo!");
        }
      },
      error: (err) => {
        this.mostraErrore("Errore salvataggio dati anagrafici.");
      }
    });
  }

  gestisciCambioPassword() {

    this.api.checkUserPassword(this.userId, this.vecchiaPassword).subscribe({
      next: (res) => {

        const isValid = (res as any) === true || (res as any).valid === true;

        if (isValid) {
          this.aggiornaPasswordFinale();
        } else {
          this.mostraErrore("La vecchia password non è corretta.");
        }
      },
      error: (err) => {
        this.mostraErrore("Errore verifica password.");
      }
    });
  }

  aggiornaPasswordFinale() {
    this.api.updateUserPassword(this.userId, this.nuovaPassword).subscribe({
      next: () => {
        this.PASS = this.nuovaPassword;
        this.mostraSuccesso("Profilo e Password salvati!");
        this.vecchiaPassword = '';
        this.nuovaPassword = '';
        this.confermaPassword = '';
      },
      error: (err) => {
        if (err.status === 400) {
          this.mostraErrore("Errore Dati (400): Il server non accetta il formato della password.");
        } else {
          this.mostraErrore("Errore tecnico cambio password (" + err.status + ")");
        }
      }
    });
  }

  mostraErrore(msg: string) {
    this.messaggioErrore = msg;
    this.cd.detectChanges();
    setTimeout(() => { this.messaggioErrore = ''; this.cd.detectChanges(); }, 5000);
  }

  mostraSuccesso(msg: string) {
    this.messaggioSuccesso = msg;
    this.cd.detectChanges();
    setTimeout(() => { this.messaggioSuccesso = ''; this.cd.detectChanges(); }, 3000);
  }
}
