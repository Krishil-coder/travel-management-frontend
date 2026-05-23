import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="card section">
      <h1 class="page-title">Unauthorized</h1>
      <p class="page-subtitle">You do not have permission to open this page.</p>
      <a class="btn btn-primary" routerLink="/home">Go to dashboard</a>
    </section>
  `
})
export class UnauthorizedComponent {}
