import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'admin' },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent)
  },
  { path: 'admin/users', pathMatch: 'full', redirectTo: 'admin' },
  {
    path: 'travel-request',
    loadComponent: () => import('./pages/travel-request/travel-request.component').then((m) => m.TravelRequestComponent)
  },
  { path: 'travel-requests', pathMatch: 'full', redirectTo: 'travel-request' },
  { path: 'travel-requests/create', pathMatch: 'full', redirectTo: 'travel-request' },
  {
    path: 'not-found',
    loadComponent: () => import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent)
  },
  { path: '**', redirectTo: 'not-found' }
];
