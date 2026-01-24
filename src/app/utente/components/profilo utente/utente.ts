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

  activeTab: string = 'games';
  searchText: string = '';

  user = {
    nome: 'Alessia',
    cognome: 'Sica',
    username: 'alessia_dev',
    email: 'alessia@studenti.unical.it',

    // ORA LE RECENSIONI HANNO LA CATEGORIA!
    recensioni: [
      {
        oggetto: 'Inception',
        categoria: 'Film',
        voto: 5,
        testo: 'Un capolavoro assoluto, trama incredibile!'
      },
      {
        oggetto: 'Barbie',
        categoria: 'Film',
        voto: 4,
        testo: 'Molto colorato e divertente, ma finale strano.'
      },
      {
        oggetto: 'The Last of Us',
        categoria: 'Games',
        voto: 5,
        testo: 'Storia commovente, gameplay perfetto.'
      },
      {
        oggetto: 'Stranger Things',
        categoria: 'Serie TV',
        voto: 4,
        testo: 'Atmosfera anni 80 fantastica, ma troppe sottotrame.'
      }
    ],

    // Lista preferiti (quella a destra)
    preferiti: [
      { titolo: 'Stranger Things', tipo: 'Serie TV' },
      { titolo: 'Harry Potter', tipo: 'Film' },
      { titolo: 'Interstellar', tipo: 'Film' },
      { titolo: 'The Witcher', tipo: 'Serie TV' },
      { titolo: 'Zelda', tipo: 'Game' }
    ]
  };

  setActiveTab(tabName: string) {
    this.activeTab = tabName;
  }

  get filteredPreferiti() {
    if (!this.searchText) {
      return this.user.preferiti;
    }
    return this.user.preferiti.filter(item =>
      item.titolo.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  rimuoviRecensione(index: number) {
    if(confirm("Eliminare questa recensione?")) {
      this.user.recensioni.splice(index, 1);
    }
  }

  rimuoviPreferito(itemDaRimuovere: any) {
    this.user.preferiti = this.user.preferiti.filter(item => item !== itemDaRimuovere);
  }
}
