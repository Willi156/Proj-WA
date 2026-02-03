import { Routes } from '@angular/router';
import { GameHomeComponent } from './games/components/game-page/game_home.component';
import { FilmPageComponent } from './film/components/film-page/film-page.component';
import { SeriePageComponent } from './serieTV/components/serieTV-page/serieTV-page.component';
import { LoginComponent } from './login/login';
import { SignupComponent } from './signup/signup';
import { UtenteComponent } from './utente/components/profilo utente/utente';
import { SettingsComponent } from './utente/components/impostazioni/settings';
import { GamesNewReleasesComponent } from './games/components/pages/games-new-releases/games-new-releases.component';
import { GamesUpcomingComponent } from './games/components/pages/games-upcoming/games-upcoming.component';
import { GamesBestComponent } from './games/components/pages/games-best-games/games-best-games';


export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/pages/home-page/home-page')
        .then(m => m.HomePageComponent),
  },
  { path: 'games', component: GameHomeComponent },
  { path: 'games/new-releases', component: GamesNewReleasesComponent },
  { path: 'games/upcoming', component: GamesUpcomingComponent },
  { path: 'games/best-games', component: GamesBestComponent },
  { path: 'movies', component: FilmPageComponent },
  { path: 'series', component: SeriePageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'user', component: UtenteComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', redirectTo: 'home' },
];
