import { Routes } from '@angular/router';
//import { LoginComponent } from './login/login.component';
//import { Signup } from './signup/signup.component';

import { UtenteComponent } from './utente/components/profilo utente/utente';

import { SettingsComponent } from './utente/components/impostazioni /settings';

export const routes: Routes = [

  { path: '', component: UtenteComponent, pathMatch: 'full' },


  { path: 'settings', component: SettingsComponent },

//  { path: 'login', component: LoginComponent },

//  { path: 'signup', component: Signup, pathMatch: 'full' }
];
