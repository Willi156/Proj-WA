import { CommonModule } from '@angular/common';
import { Component,ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiService } from '../services/api.service';

type Tab = 'signin' | 'signup';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  tab: Tab = 'signin';
  form: FormGroup;

  submitted = false;
  error = '';
  successMessage = '';

  isLoading = false;

  errors: Record<string, string> = {
    first: '', last: '', username: '', email: '', password: '',
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }


  setTab(t: Tab) {
    this.tab = t;
    this.error = '';
    this.successMessage = '';
    this.clearSignupErrors();
    this.submitted = false;
    this.isLoading = false;
  }

  onSubmitLogin() {
    this.submitted = true;
    this.error = '';
    this.successMessage = '';

    if (this.isLoading) return;
    if (this.form.invalid) return;

    const username = String(this.form.value.username ?? '').trim();
    const password = String(this.form.value.password ?? '');

    this.isLoading = true;
    this.cdr.detectChanges(); // ✅ aggiorna subito (mostra spinner)

    this.api.authenticate(username, password)
      .pipe(
        finalize(() => {
          // ✅ assicura update UI appena finisce
          this.zone.run(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: (res: any) => {
          this.zone.run(() => {
            // se backend torna 200 con ok:false
            if (res?.ok === false || res?.success === false || res?.authenticated === false) {
              this.error = 'Username o Password errati.';
              this.cdr.detectChanges();
              return;
            }

            const userToSave = res?.user ?? res?.utente ?? res?.data?.user ?? res?.data?.utente ?? res;

            const hasValidUser =
              !!userToSave &&
              typeof userToSave === 'object' &&
              (userToSave.id != null || userToSave.username != null || userToSave.email != null);

            if (!hasValidUser) {
              this.error = 'Username o Password errati.';
              this.cdr.detectChanges();
              return;
            }

            localStorage.setItem('datiUtente', JSON.stringify(userToSave));
            if (userToSave.id != null) localStorage.setItem('userId', String(userToSave.id));

            this.cdr.detectChanges();
            this.router.navigate(['/user']);
          });
        },
        error: (err) => {
          this.zone.run(() => {
            if (err?.status === 401 || err?.status === 403) {
              this.error = 'Username o Password errati.';
            } else if (err?.status === 0) {
              this.error = 'Connessione al server non disponibile.';
            } else {
              this.error = 'Errore durante il login. Riprova.';
            }
            this.cdr.detectChanges();
            console.error(err);
          });
        }
      });
  }


  onSubmit(event: Event, first: string, last: string, username: string, email: string, password: string) {
    event.preventDefault();
    this.successMessage = '';
    this.clearSignupErrors();

    let ok = true;
    if (!first?.trim()) { this.errors['first'] = 'Nome richiesto'; ok = false; }
    if (!last?.trim()) { this.errors['last'] = 'Cognome richiesto'; ok = false; }
    if (!username?.trim()) { this.errors['username'] = 'Username richiesto'; ok = false; }
    if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) { this.errors['email'] = 'Email non valida'; ok = false; }
    if (!password || password.length < 6) { this.errors['password'] = 'Minimo 6 caratteri'; ok = false; }

    if (!ok) return;

    this.successMessage = 'Registrazione completata! Ora puoi accedere.';
    setTimeout(() => this.setTab('signin'), 2000);
  }

  private clearSignupErrors() {
    this.errors = { first: '', last: '', username: '', email: '', password: '' };
  }
}
