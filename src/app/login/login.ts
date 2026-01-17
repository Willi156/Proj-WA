import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  form;

  submitted = false;
  error: string | null = null;

  constructor(private fb: FormBuilder, private router: Router, private api: ApiService) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
    console.log('[LoginComponent] instance created');
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    const { username, password } = this.form.value;
    if(!username || !password) {
      this.error = 'Username e password sono obbligatori';
      return;
    }

    this.api.getContenuti().subscribe({
      next: (contenuti) => {
        console.log('Contenuti ricevuti:', contenuti);
      },
      error: (err) => {
        console.error('Errore nel recupero dei contenuti:', err);
        this.error = err?.error?.message ?? 'Errore sconosciuto durante il recupero dei contenuti';
      }
    });

    // this.api.newContenuto('Titolo di esempio', 'Descrizione di esempio', 'Genere di esempio', 'http://linkdi.esempio', 'GIOCO', 2024, undefined, "PIPPO").subscribe({
    //   next: (res) => {
    //     console.log('Contenuto creato con ID:', res.id);
    //   },
    //   error: (err) => {
    //     console.error('Errore nella creazione del contenuto:', err);
    //     this.error = err?.error?.message ?? 'Errore sconosciuto durante la creazione del contenuto';
    //   }
    // });

    // this.api.newContenuto('Titolo di esempio', 'Descrizione di esempio', 'Genere di esempio', 'http://linkdi.esempio', 'FILM', 2024, "PIPPO" ).subscribe({
    //   next: (res) => {
    //     console.log('Contenuto creato con ID:', res.id);
    //   },
    //   error: (err) => {
    //     console.error('Errore nella creazione del contenuto:', err);
    //     this.error = err?.error?.message ?? 'Errore sconosciuto durante la creazione del contenuto';
    //   }
    // });

    //  this.api.newContenuto('Titolo di esempio', 'Descrizione di esempio', 'Genere di esempio', 'http://linkdi.esempio', 'SERIE_TV', 2024, undefined, undefined, false, 3).subscribe({
    //   next: (res) => {
    //     console.log('Contenuto creato con ID:', res.id);
    //   },
    //   error: (err) => {
    //     console.error('Errore nella creazione del contenuto:', err);
    //     this.error = err?.error?.message ?? 'Errore sconosciuto durante la creazione del contenuto';
    //   }
    // });

    // this.api.authenticate(username, password).subscribe({
    //   next: (res) => {
    //     console.log('Login successful, token:', res.token);
    //     // Navigate to the main page or dashboard after successful login
    //     this.router.navigate(['/']);
    //   },
    //   error: (err) => {
    //     console.error('Login error:', err);
    //     this.error = err?.error?.message ?? 'Errore sconosciuto';
    //   }
    // });
    // this.api.getServerTime().subscribe({
    //   next: (res) => {
    //     // compatibile con il JSON { serverTime: { now: ... } }
    //     let pippo = (res.serverTime as any).now ?? JSON.stringify(res.serverTime);
    //     console.log('Server time from API:', pippo);
    //   },
    //   error: (err) => {
    //     this.error = err?.message ?? 'Errore sconosciuto';
    //     console.error('API error', err);
    //   }
    // });
    // this.api.getFirstUser().subscribe({
    //   next: (user) => {
    //     console.log('Primo utente:', user);
    //     let usergetter = user;
    //     console.log('Username del primo utente:', usergetter.username);
    //   },
    //   error: (err) => {
    //     console.error('Errore API:', err);
    //     this.error = err?.error?.message ?? 'Errore sconosciuto';
    //   }
    // });

    // console.log('Login attempt', { username, password });
    // // TODO: call AuthService to authenticate and handle errors
    // // For now navigate to root on submit as a placeholder
    // this.router.navigate(['/signup']);
  }
}