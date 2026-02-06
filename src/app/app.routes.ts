import { Routes } from '@angular/router';
import { GameHomeComponent } from './games/components/game-page/game_home.component';
import { FilmPageComponent } from './film/components/film-page/film-page.component';
import { SeriePageComponent } from './serieTV/components/serieTV-page/serieTV-page.component';
import { LoginComponent } from './login/login';
import { SignupComponent } from './signup/signup';
import { DetailsPageComponent } from './details-page/details-page';
import { UtenteComponent } from './utente/components/profilo utente/utente';
import { SettingsComponent } from './utente/components/impostazioni/settings';
import { GamesNewReleasesComponent } from './games/components/pages/games-new-releases/games-new-releases.component';
import { GamesUpcomingComponent } from './games/components/pages/games-upcoming/games-upcoming.component';
import { GamesBestComponent } from './games/components/pages/games-best-games/games-best-games';
import {NuovoContenutoComponent} from './nuovo-contenuto/aggiungi_contenuto';
import {GestioneContenutiComponent} from './gestione-admin/gestione-contenuti.component';
import {MoviesReleasedComponent} from './film/components/pages/movies-released/movies-released.component';
import {MoviesUpcomingComponent} from './film/components/pages/movies-upcoming/movies-upcoming.component';
import {MoviesBestComponent} from './film/components/pages/best-movies/movies-best.component';
import {SeriesReleasedComponent} from './serieTV/components/pages/serieTV-released/series-released.component';
import {SeriesUpcomingComponent} from './serieTV/components/pages/serieTV-upcoming/series-upcoming.component';

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
  { path: 'movies/released', component: MoviesReleasedComponent},
  { path: 'movies/upcoming', component: MoviesUpcomingComponent},
  { path: 'movies/best-films', component: MoviesBestComponent},
  { path: 'series', component:SeriePageComponent},
  { path: 'series/released', component: SeriesReleasedComponent },
  { path: 'series/upcoming', component: SeriesUpcomingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'user', component: UtenteComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'aggiungi-contenuto', component:NuovoContenutoComponent },
  { path: 'modifica-contenuto/:id', component: NuovoContenutoComponent },
  { path: 'admin/gestione', component: GestioneContenutiComponent },
  { path: 'details/:kind/:id', component: DetailsPageComponent },
  { path: '**', redirectTo: 'home' },
];
