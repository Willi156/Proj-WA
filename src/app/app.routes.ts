import { Routes } from '@angular/router';
import { GameHomeComponent } from './games/components/game-page/game_home.component';
import { FilmPageComponent } from './film/components/film-page/film-page.component';
import { SeriePageComponent } from './serieTV/components/serieTV-page/serieTV-page.component';

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
  { path: '**', redirectTo: '' }
];
