import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';


type Tab = 'signin' | 'signup';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  tab: Tab = 'signin';

  form: FormGroup;
  submitted = false;

  error = '';

  errors: Record<string, string> = {
    first: '',
    last: '',
    username: '',
    email: '',
    password: '',
  };

  successMessage = '';

  constructor(private fb: FormBuilder, private router: Router, private api:ApiService) {
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
  }

  onSubmitLogin() {
    this.submitted = true;
    this.error = '';

    if (this.form.invalid) return;

    const { username, password } = this.form.value;

    this.api.authenticate(username, password ).subscribe({
      next:(user:any)=>{this.router.navigate(["/user"],{state:{user}})}
    })
    console.log('LOGIN:', { username, password });


    // TODO: collega al backend
  }

  onSubmit(
    event: Event,
    first: string,
    last: string,
    username: string,
    email: string,
    password: string
  ) {
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

    console.log('SIGNUP:', { first, last, username, email, password });

    this.successMessage = 'Registrazione completata!';
    // opzionale: torna al login
    // this.setTab('signin');
  }

  private clearSignupErrors() {
    this.errors = { first: '', last: '', username: '', email: '', password: '' };
  }
}
