import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly user = this.authService.currentUser;
  message = '';

  stats = [
    { label: 'Total Requests', value: '12', hint: 'This Year', tone: 'blue', icon: 'briefcase' },
    { label: 'Approved Requests', value: '8', hint: 'This Year', tone: 'green', icon: 'check' },
    { label: 'Pending Requests', value: '3', hint: 'Awaiting Approval', tone: 'orange', icon: 'clock' },
    { label: 'Total Expenses', value: 'INR 48,750', hint: 'This Year', tone: 'purple', icon: 'wallet' }
  ];

  actions = [
    {
      title: 'Create Travel Request',
      text: 'Submit a new travel request with destination, dates, and budget details.',
      button: 'Create Request',
      route: '/travel-requests/create',
      tone: 'blue',
      icon: 'send'
    },
    {
      title: 'View My Requests',
      text: 'Check the status of your submitted travel requests and approvals.',
      button: 'View Requests',
      route: '/travel-requests',
      tone: 'green',
      icon: 'document'
    },
    {
      title: 'My Expenses',
      text: 'Submit and track your travel expense claims and reimbursements.',
      button: 'Manage Expenses',
      route: '/expenses',
      tone: 'orange',
      icon: 'wallet'
    }
  ];

  get initials(): string {
    const name = this.user()?.name ?? 'Travel User';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  showNotifications(): void {
    this.message = 'No new notifications right now.';
  }

  showHelp(): void {
    this.message = 'Use the left navigation to create requests, track approvals, submit expenses, and view reports.';
  }

  goToProfile(): void {
    const role = this.authService.getRole();
    if (role) {
      void this.router.navigateByUrl(this.authService.getDashboardRoute(role));
    }
  }
}
