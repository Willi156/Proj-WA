import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './settings.html',
})
export class SettingsComponent {

  user = {
    nome: 'Alessia',
    cognome: 'Sica',
    username: 'alessia_dev',
    email: 'alessia@studenti.unical.it',
  };

  vecchiaPassword: string = '';
  nuovaPassword: string = '';
  confermaPassword: string = '';

  salva() {

    if (this.nuovaPassword || this.confermaPassword) {


      if (!this.vecchiaPassword) {
        alert("ERRORE: Devi inserire la vecchia password per procedere.");
        return;
      }


      if (this.nuovaPassword !== this.confermaPassword) {
        alert("ERRORE: La nuova password e la conferma non coincidono!");
        return;
      }

      console.log('Password cambiata con successo!');
    }


    console.log('Dati salvati:', this.user);
    alert('Modifiche salvate con successo!');


    this.vecchiaPassword = '';
    this.nuovaPassword = '';
    this.confermaPassword = '';
  }
}
