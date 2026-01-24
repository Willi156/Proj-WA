import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-utente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './utente.html',
  styleUrl: './utente.css'
})
export class UtenteComponent {

  user = {
    nome: 'Alessia',
    cognome: 'Sica',
    username: 'alessia_dev',
    email: 'alessia@studenti.unical.it',

    preferiti: [
      { titolo: 'Stranger Things', tipo: 'Serie TV', cover: '📺' },
      { titolo: 'Harry Potter', tipo: 'Film', cover: '⚡' },
      { titolo: 'Interstellar', tipo: 'Film', cover: '🚀' },
      { titolo: 'The Witcher', tipo: 'Serie TV', cover: '⚔️' }
    ],

    recensioni: [
      { oggetto: 'Inception', voto: 5, testo: 'Un capolavoro assoluto, trama incredibile!' },
      { oggetto: 'Barbie', voto: 4, testo: 'Molto colorato e divertente, ma finale strano.' }
    ]
  };


  rimuoviPreferito(index: number) {
    if(confirm("Vuoi davvero rimuovere questo preferito?")) {
      this.user.preferiti.splice(index, 1);
    }
  }


  rimuoviRecensione(index: number) {
    if(confirm("Vuoi cancellare questa recensione?")) {
      this.user.recensioni.splice(index, 1);
    }
  }
}
