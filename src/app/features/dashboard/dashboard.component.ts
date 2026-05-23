import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { DashboardService } from '@core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  readonly user = this.authService.currentUser;
  readonly stats = this.dashboardService.getStats();
  readonly recentActivity = this.dashboardService.getRecentActivity();
  readonly dashboardMessage = 'Create travel requests, track approvals, manage expenses, and follow reimbursements.';
}
