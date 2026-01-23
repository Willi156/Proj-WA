import {Routes} from '@angular/router';
import {GameHomeComponent} from './games/components/game-page/game_home.component';
import {FilmPageComponent} from './film/components/film-page/film-page.component';
import {SeriePageComponent} from './serieTV/components/serieTV-page/serieTV-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'games', pathMatch: 'full' },
  { path: 'games', component: GameHomeComponent },
  { path: 'film', component: FilmPageComponent },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/pages/home-page/home-page').then(
        (m) => m.HomePageComponent
      ),
  }
];
