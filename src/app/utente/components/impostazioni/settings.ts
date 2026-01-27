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

  // --- CREDENZIALI PER IL SALVATAGGIO ---
  readonly USER = 'WIMAn';
  readonly PASS = '1234567!';
  // --------------------------------------

  user = {
    nome: '',
    cognome: '',
    username: '',
    email: '',
    immagineProfilo: ''
  };
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
        const obj = JSON.parse(datiSalvati);
        this.user = { ...this.user, ...obj };
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
    this.cd.detectChanges();

    if (!this.userId) {
      this.mostraErrore("Dati utente non caricati.");
      return;
    }

    // Refresh sessione per garantire il salvataggio
    this.api.authenticate(this.USER, this.PASS).subscribe({
      next: () => {
        this.eseguiUpdate();
      },
      error: (err) => {
        console.error(err);
        this.mostraErrore("Errore connessione DB.");
      }
    });
  }

  eseguiUpdate() {
    if (this.nuovaPassword || this.confermaPassword) {
      if (!this.vecchiaPassword) { this.mostraErrore("Inserisci la vecchia password."); return; }
      if (this.nuovaPassword !== this.confermaPassword) { this.mostraErrore("Le password non coincidono."); return; }
    }

    this.api.updateUserInfo(
      this.userId,
      this.user.nome,
      this.user.cognome,
      this.user.email,
      this.user.immagineProfilo
    ).subscribe({
      next: (res) => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('datiUtente', JSON.stringify(this.user));
        }
        if (this.nuovaPassword) {
          this.gestisciPassword();
        } else {
          this.mostraSuccesso("Profilo aggiornato con successo!");
        }
      },
      error: (err) => {
        console.error(err);
        this.mostraErrore("Errore tecnico salvataggio.");
      }
    });
  }

  gestisciPassword() {
    this.api.checkUserPassword(this.userId, this.vecchiaPassword).subscribe({
      next: (res) => {
        if (res.valid) {
          this.api.updateUserPassword(this.userId, this.nuovaPassword).subscribe({
            next: () => {
              this.mostraSuccesso("Password aggiornata!");
              this.vecchiaPassword = ''; this.nuovaPassword = ''; this.confermaPassword = '';
            },
            error: () => this.mostraErrore("Errore cambio password.")
          });
        } else {
          this.mostraErrore("Vecchia password errata.");
        }
      },
      error: () => this.mostraErrore("Errore verifica password.")
    });
  }

  mostraErrore(msg: string) {
    this.messaggioErrore = msg;
    this.cd.detectChanges();
    setTimeout(() => {
      this.messaggioErrore = '';
      this.cd.detectChanges();
    }, 4000);
  }

  mostraSuccesso(msg: string) {
    this.messaggioSuccesso = msg;
    this.cd.detectChanges();
    setTimeout(() => {
      this.messaggioSuccesso = '';
      this.cd.detectChanges();
    }, 3000);
  }
}
