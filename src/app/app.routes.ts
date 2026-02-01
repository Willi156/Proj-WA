import { Routes } from '@angular/router';
import { GameHomeComponent } from './games/components/game-page/game_home.component';
import { FilmPageComponent } from './film/components/film-page/film-page.component';
import { SeriePageComponent } from './serieTV/components/serieTV-page/serieTV-page.component';
import { LoginComponent } from './login/login';
import { SignupComponent } from './signup/signup';
import { DetailsPageComponent } from './details-page/details-page';

import { UtenteComponent } from './utente/components/profilo utente/utente';
import { SettingsComponent } from './utente/components/impostazioni/settings';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/pages/home-page/home-page')
        .then(m => m.HomePageComponent),
  },
  { path: 'games', component: GameHomeComponent },
  { path: 'movies', component: FilmPageComponent },
  { path: 'series', component: SeriePageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'user', component: UtenteComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'details/:kind/:id', component: DetailsPageComponent },
  { path: '**', redirectTo: '' },

];
