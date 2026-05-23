import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="card section">
      <h1 class="page-title">Page Not Found</h1>
      <p class="page-subtitle">The page you requested does not exist.</p>
      <a class="btn btn-primary" routerLink="/admin">Go to admin</a>
    </section>
  `
})
export class NotFoundComponent {}
