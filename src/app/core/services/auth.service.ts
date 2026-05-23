import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { Observable, tap } from 'rxjs';

export type UserRole = User['role'];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'loggedInUser';
  private readonly tokenKey = 'authToken';
  private readonly http = inject(HttpClient);

  currentUser = signal<User | null>(this.getStoredUser());

  constructor(private readonly router: Router) {}

  login(email: string, password: string): Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(({ token, user }) => {
        this.storeSession(token, user);
      })
    );
  }

  register(name: string, email: string, department: string): void {
    this.http.post<{ token: string; user: User }>(`${environment.apiUrl}/auth/register`, { name, email, department }).subscribe({
      next: ({ token, user }) => {
        this.storeSession(token, user);
        void this.router.navigateByUrl(this.getDashboardRoute(user.role));
      }
    });
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.tokenKey);
    void this.router.navigateByUrl('/login');
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRole(): UserRole | null {
    return this.currentUser()?.role ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getDashboardRoute(role: UserRole): string {
    const routes: Record<UserRole, string> = {
      EMPLOYEE: '/employee/dashboard',
      MANAGER: '/manager/dashboard',
      FINANCE: '/finance/dashboard',
      ADMIN: '/admin/dashboard'
    };

    return routes[role];
  }

  private getStoredUser(): User | null {
    const value = localStorage.getItem(this.storageKey);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as User;
    } catch {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.tokenKey);
      return null;
    }
  }

  private storeSession(token: string, user: User): void {
    this.currentUser.set(user);
    localStorage.setItem(this.storageKey, JSON.stringify(user));
    localStorage.setItem(this.tokenKey, token);
  }
}
