import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="card section">
      <h1 class="page-title">Page Not Found</h1>
      <p class="page-subtitle">The page you requested does not exist.</p>
      <a class="btn btn-primary" [routerLink]="dashboardRoute">Go to workspace</a>
    </section>
  `
})
export class NotFoundComponent {
  private readonly authService = inject(AuthService);

  get dashboardRoute(): string {
    const role = this.authService.currentRole();

    return role ? this.authService.getDashboardRoute(role) : '/login';
  }
}
