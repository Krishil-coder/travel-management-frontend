import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { Observable, map, tap } from 'rxjs';

export type UserRole = User['role'];

interface LoginResponse {
  success?: boolean;
  message?: string;
  timestamp?: string;
  token?: string;
  jwt?: string;
  accessToken?: string;
  tokenType?: string;
  userId?: number;
  id?: number;
  name?: string;
  email?: string;
  username?: string;
  department?: string;
  role?: UserRole | 'FINANCER' | string;
  roles?: string[];
  user?: ApiUser;
  data?: LoginResponse;
}

type ApiUser = Partial<Omit<User, 'role'>> & {
  userId?: number;
  firstName?: string;
  firstname?: string;
  lastName?: string;
  lastname?: string;
  role: UserRole | 'FINANCER' | string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  currentUser = signal<User | null>(this.getStoredUser());

  constructor(private readonly router: Router) {}

  login(email: string, password: string): Observable<{ token: string | null; user: User }> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      map((response) => this.buildLoginSession(response, email)),
      tap(({ token, user }) => {
        this.storeSession(token, user);
      })
    );
  }

  register(name: string, email: string, department: string): void {
    this.http.post<{ token: string; user: ApiUser }>(`${environment.apiUrl}/auth/register`, { name, email, department }).subscribe({
      next: ({ token, user }) => {
        const normalizedUser = this.normalizeUser(user);

        this.storeSession(token, normalizedUser);
        void this.router.navigateByUrl(this.getDashboardRoute(normalizedUser.role));
      }
    });
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
    localStorage.removeItem('firstname');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    void this.router.navigateByUrl('/login');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  currentUserId(): number {
    return Number(localStorage.getItem('userId') || 0);
  }

  currentRole(): UserRole | null {
    const role = localStorage.getItem('role');
    return role ? this.toAppRole(role) : null;
  }

  getRole(): UserRole | null {
    return this.currentRole();
  }

  isLoggedIn(): boolean {
    return !!this.getToken() || !!this.currentRole();
  }

  getDashboardRoute(role: UserRole): string {
    const routes: Record<UserRole, string> = {
      EMPLOYEE: '/requests',
      MANAGER: '/manager/approvals',
      FINANCE: '/finance/approvals',
      ADMIN: '/admin'
    };

    return routes[role];
  }

  private buildLoginSession(response: LoginResponse, loginEmail: string): { token: string | null; user: User } {
    const responseBody = response.data || response;
    const token = this.getResponseToken(responseBody);

    const tokenUser = this.getUserFromToken(token);
    const apiUser: Partial<ApiUser> = responseBody.user || responseBody;
    const email = apiUser.email || responseBody.email || tokenUser.email || loginEmail;
    const role = apiUser.role ||
      responseBody.role ||
      responseBody.roles?.[0] ||
      tokenUser.role ||
      this.getRoleFromEmail(email);

    return {
      token,
      user: this.normalizeUser({
        ...tokenUser,
        ...apiUser,
        id: apiUser.id || apiUser.userId || responseBody.userId || responseBody.id || tokenUser.id,
        name: apiUser.name || responseBody.name || responseBody.username || tokenUser.name,
        email,
        role
      })
    };
  }

  private getStoredUser(): User | null {
    const id = this.currentUserId();
    const name = this.getStoredName();
    const email = localStorage.getItem('email') || '';
    const role = this.currentRole();

    if (!id || !role) {
      return null;
    }

    return {
      id,
      name,
      email,
      department: '',
      role
    };
  }

  private storeSession(token: string | null, user: User): void {
    this.currentUser.set(user);
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    localStorage.setItem('userId', String(user.id));
    const storedName = this.splitName(user.name);
    localStorage.setItem('firstName', storedName.firstName);
    localStorage.setItem('lastName', storedName.lastName);
    localStorage.removeItem('name');
    localStorage.removeItem('firstname');
    localStorage.setItem('email', user.email);
    localStorage.setItem('role', user.role);
  }

  private normalizeUser(user: ApiUser): User {
    const name = user.name || this.joinName(user.firstName || user.firstname, user.lastName || user.lastname);

    return {
      id: Number(user.id || user.userId || 0),
      name,
      email: user.email || '',
      department: user.department || '',
      role: this.toAppRole(user.role)
    };
  }

  private toAppRole(role: string): UserRole {
    const normalizedRole = String(role || '')
      .trim()
      .toUpperCase()
      .replace(/^ROLE_/, '');

    if (normalizedRole === 'FINANCER' || normalizedRole === 'FINANCE_USER') {
      return 'FINANCE';
    }

    if (
      normalizedRole === 'ADMINISTRATOR' ||
      normalizedRole === 'ADMINISTRATION' ||
      normalizedRole === 'ADMINISTARION'
    ) {
      return 'ADMIN';
    }

    if (['EMPLOYEE', 'MANAGER', 'FINANCE', 'ADMIN'].includes(normalizedRole)) {
      return normalizedRole as UserRole;
    }

    return 'EMPLOYEE';
  }

  private getResponseToken(response: LoginResponse): string | null {
    return response.token || response.jwt || response.accessToken || null;
  }

  private getUserFromToken(token: string | null): ApiUser {
    const payload = this.decodeJwtPayload(token);
    const role = payload?.role || payload?.roles?.[0] || payload?.authorities?.[0]?.authority || payload?.authorities?.[0];

    return {
      id: payload?.userId || payload?.id || payload?.sub,
      name: payload?.name || payload?.fullName || payload?.username || '',
      email: payload?.email || payload?.sub || '',
      role: role || ''
    };
  }

  private getStoredName(): string {
    return this.joinName(
      localStorage.getItem('firstname') || localStorage.getItem('firstname'),
      localStorage.getItem('lastname')
    ) || localStorage.getItem('name') || '';
  }

  private splitName(name: string): { firstName: string; lastName: string } {
    const [firstName = '', ...lastNameParts] = name.trim().split(/\s+/);

    return {
      firstName,
      lastName: lastNameParts.join(' ')
    };
  }

  private joinName(firstName?: string | null, lastName?: string | null): string {
    return [firstName, lastName]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ');
  }

  private getRoleFromEmail(email: string): UserRole {
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail.startsWith('admin')) {
      return 'ADMIN';
    }

    if (normalizedEmail.startsWith('manager')) {
      return 'MANAGER';
    }

    if (normalizedEmail.startsWith('finance') || normalizedEmail.startsWith('financer')) {
      return 'FINANCE';
    }

    return 'EMPLOYEE';
  }

  private decodeJwtPayload(token: string | null): any {
    try {
      if (!token) {
        return {};
      }

      const payload = token.split('.')[1];

      if (!payload) {
        return {};
      }

      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');

      return JSON.parse(atob(paddedPayload));
    } catch {
      return {};
    }
  }
}
