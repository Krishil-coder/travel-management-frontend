import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
  readonly user = this.authService.currentUser;
  private readonly allMenuItems: NavItem[] = [
    { label: 'Dashboard', icon: 'Home', route: '/dashboard', roles: ['EMPLOYEE', 'MANAGER', 'FINANCE', 'ADMIN'] },
    { label: 'Create Request', icon: '+', route: '/travel-requests/create', roles: ['EMPLOYEE'] },
    { label: 'Travel Requests', icon: 'List', route: '/travel-requests', roles: ['EMPLOYEE', 'MANAGER', 'FINANCE', 'ADMIN'] },
    { label: 'Approvals', icon: 'OK', route: '/approvals/manager', roles: ['MANAGER'] },
    { label: 'Finance Approvals', icon: 'Rs', route: '/approvals/finance', roles: ['FINANCE'] },
    { label: 'Expenses', icon: 'Box', route: '/expenses', roles: ['EMPLOYEE'] },
    { label: 'Reimbursements', icon: 'Pay', route: '/reimbursements', roles: ['FINANCE'] },
    { label: 'Reports', icon: 'Rpt', route: '/reports', roles: ['MANAGER', 'FINANCE', 'ADMIN'] },
    { label: 'Policy Management', icon: 'Pol', route: '/admin/policies', roles: ['ADMIN'] },
    { label: 'User Management', icon: 'Usr', route: '/admin/users', roles: ['ADMIN'] },
    { label: 'Audit Logs', icon: 'Log', route: '/audit-logs', roles: ['ADMIN'] }
  ];

  get menuItems(): NavItem[] {
    const role = this.authService.getRole();
    return role ? this.allMenuItems.filter((item) => item.roles.includes(role)) : [];
  }

  logout(): void {
    this.authService.logout();
  }
}
