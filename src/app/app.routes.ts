import { Routes } from '@angular/router';
import { GameHomeComponent } from './games/components/game-page/game_home.component';
import { FilmPageComponent } from './film/components/film-page/film-page.component';
import { SeriePageComponent } from './serieTV/components/serieTV-page/serieTV-page.component';
import { LoginComponent } from './login/login';
import { SignupComponent } from './signup/signup';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/pages/home-page/home-page').then(
        (m) => m.HomePageComponent
      ),
  },

  { path: 'games', component: GameHomeComponent, runGuardsAndResolvers: 'always'},
  { path: 'movies', component: FilmPageComponent, runGuardsAndResolvers: 'always'},
  { path: 'series', component: SeriePageComponent, runGuardsAndResolvers: 'always'},
  { path: '**', redirectTo: '' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },

  // default
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
