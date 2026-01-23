import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/pages/home-page/home-page').then(
        (m) => m.HomePageComponent
      ),
  },
];
