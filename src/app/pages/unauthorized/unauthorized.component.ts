import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="card section">
      <h1 class="page-title">Unauthorized</h1>
      <p class="page-subtitle">You do not have permission to open this page.</p>
      <a class="btn btn-primary" [routerLink]="dashboardRoute">Go to workspace</a>
    </section>
  `
})
export class UnauthorizedComponent {
  private readonly authService = inject(AuthService);

  get dashboardRoute(): string {
    const role = this.authService.currentRole();

    return role ? this.authService.getDashboardRoute(role) : '/login';
  }
}
