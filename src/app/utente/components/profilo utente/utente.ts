import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import {empty} from 'rxjs';



@Component({
  selector: 'app-utente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './utente.html',
  styleUrl: './utente.css'
})
export class UtenteComponent implements OnInit{
  userId=2;
  preferitiIds:number []=[];
  constructor(private api:ApiService) {

  }

  ngOnInit():void{this.api.getFavouritesMediaByUserId(this.userId).subscribe(ids=>{
    this.preferitiIds=ids;
  })}

  activeTab: string = 'games';
  searchText: string = '';

  user = {
    nome: 'Alessia',
    cognome: 'Sica',
    username: 'alessia_dev',
    email: 'alessia@studenti.unical.it',
  }



  setActiveTab(tabName: string) {
    this.activeTab = tabName;
  }

  /**get filteredPreferiti() {
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
  }*/
  protected readonly empty = empty;
}
