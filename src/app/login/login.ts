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
    this.api.getServerTime().subscribe({
      next: (res) => {
        // compatibile con il JSON { serverTime: { now: ... } }
        let pippo = (res.serverTime as any).now ?? JSON.stringify(res.serverTime);
        console.log('Server time from API:', pippo);
      },
      error: (err) => {
        this.error = err?.message ?? 'Errore sconosciuto';
        console.error('API error', err);
      }
    });
    this.api.getFirstUser().subscribe({
      next: (user) => {
        console.log('Primo utente:', user);
        let usergetter = user;
        console.log('Username del primo utente:', usergetter.username);
      },
      error: (err) => {
        console.error('Errore API:', err);
        this.error = err?.error?.message ?? 'Errore sconosciuto';
      }
    });

    console.log('Login attempt', { username, password });
    // TODO: call AuthService to authenticate and handle errors
    // For now navigate to root on submit as a placeholder
    this.router.navigate(['/signup']);
  }
}