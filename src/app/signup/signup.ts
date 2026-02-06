import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup',
  imports: [RouterLink,CommonModule, ReactiveFormsModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css'],
  standalone: true,
})
export class SignupComponent  {
  errors: { [key: string]: string } = { first: '', last: '', username: '', email: '', password: '' };
  successMessage = '';
  constructor(private api: ApiService, private cdr: ChangeDetectorRef, private router: Router) {}


  private resetErrors() {
    this.errors = { first: '', last: '', username: '', email: '', password: '' };
    this.successMessage = '';
  }

  private validateEmail(email: string) {
    // simple email regex
    const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    return re.test(email);
  }

  private validatePassword(pw: string) {
    if (!pw || pw.length < 8) return 'La password deve contenere almeno 8 caratteri.';
    if (!/[a-z]/.test(pw)) return 'La password deve contenere almeno una lettera minuscola.';
    if (!/[A-Z]/.test(pw)) return 'La password deve contenere almeno una lettera maiuscola.';
    if (!/\d/.test(pw)) return 'La password deve contenere almeno un numero.';
    if (!/[^A-Za-z0-9]/.test(pw)) return 'La password deve contenere almeno un carattere speciale.';
    return '';
  }


  private async validateUsername(username: string): Promise<boolean> {
    try {
      const res = await firstValueFrom(this.api.getCheckUsername(username));
      console.log('Username availability response:', res);
      return !res;
    } catch (err: any) {
      console.error('Errore nel recupero dello username:', err);
      return false;
    }
  }


  async onSubmit(event: Event, first: string, last: string, username: string, email: string, password: string) {
    event.preventDefault();
    this.resetErrors();

    let valid = true;
    if (!first || first.trim().length === 0) {
      this.errors['first'] = 'Il nome è obbligatorio.';
      valid = false;
    }
    if (!last || last.trim().length === 0) {
      this.errors['last'] = 'Il cognome è obbligatorio.';
      valid = false;
    }
    if (!username || username.trim().length === 0) {
      this.errors['username'] = 'Lo username è obbligatorio.';
      valid = false;
    } else {
      const available = await this.validateUsername(username);
      if (!available) {
        console.log('username not available:', username);
        this.errors['username'] = 'Lo username inserito è già in uso';
        valid = false;
      }
    }
    if (!email || !this.validateEmail(email)) {
      this.errors['email'] = 'Inserisci un indirizzo email valido.';
      valid = false;
    }
    const pwError = this.validatePassword(password);
    if (pwError) {
      this.errors['password'] = pwError;
      valid = false;
    }

    if (!valid) {
      // force immediate UI refresh when validation fails
      this.cdr.detectChanges();
      return;
    }

    this.api.createUser(first, last, username, password, email).subscribe({
      next: (response: any) => {
        console.log('User created with ID:', response.id);
        this.successMessage = 'Registrazione completata con successo.';
        this.cdr.detectChanges();
        this.router.navigate(['/login']);
        
      },
      error: (err: any) => {
        console.error('Errore durante la registrazione:', err);
        this.successMessage = 'Si è verificato un errore durante la registrazione. Riprova più tardi.';
      }
    });
  }
}
