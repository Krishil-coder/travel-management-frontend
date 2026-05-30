import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, UserRole } from '@core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: 'users' | 'policy' | 'report' | 'plus' | 'list' | 'check' | 'wallet';
  roles: UserRole[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);

  readonly user = this.authService.currentUser;
  readonly dashboardRoute = computed(() => {
    const role = this.authService.currentRole();

    return role ? this.authService.getDashboardRoute(role) : '/login';
  });

  readonly navItems = computed(() => {
    const role = this.authService.currentRole();

    if (!role) {
      return [];
    }

    return this.items.filter((item) => item.roles.includes(role));
  });

  private readonly items: NavItem[] = [
    { label: 'Users', route: '/admin', icon: 'users', roles: ['ADMIN'] },
    { label: 'Policies', route: '/admin/policies', icon: 'policy', roles: ['ADMIN'] },
    { label: 'Reports', route: '/admin/reports', icon: 'report', roles: ['ADMIN'] },
    { label: 'My Requests', route: '/requests', icon: 'list', roles: ['EMPLOYEE'] },
    { label: 'New Request', route: '/requests/new', icon: 'plus', roles: ['EMPLOYEE'] },
    { label: 'Manager Approval', route: '/manager/approvals', icon: 'check', roles: ['MANAGER'] },
    { label: 'Financer Approval', route: '/finance/approvals', icon: 'wallet', roles: ['FINANCE'] }
  ];

  get initials(): string {
    const name = this.user()?.name || this.user()?.email || 'User';
    const parts = name.trim().split(/\s+/).slice(0, 2);

    return parts.map((part) => part[0]?.toUpperCase()).join('') || 'U';
  }

  get displayRole(): string {
    const role = this.authService.currentRole();

    return role === 'FINANCE' ? 'Financer' : this.toTitleCase(role || 'User');
  }

  logout(): void {
    this.authService.logout();
  }

  private toTitleCase(value: string): string {
    return value.toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
  }
}
