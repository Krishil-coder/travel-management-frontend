import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  message = '';
  loading = false;
  showPassword = false;

  login(): void {
    if (!this.email.trim() || !this.password.trim()) {
      this.message = 'Please enter both email and password.';
      return;
    }

    this.loading = true;
    this.message = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        void this.router.navigateByUrl(this.authService.getDashboardRoute(res.user.role));
      },
      error: (err) => {
        this.loading = false;
        this.message = this.getLoginErrorMessage(err);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private getLoginErrorMessage(err: any): string {
    if (err.status === 0) {
      return 'Cannot connect to backend. Is Spring Boot running on port 8080?';
    }

    if (err.status === 404) {
      return 'Login API was not found. Restart Angular with proxy enabled, then try again.';
    }

    if (err.status === 401 || err.status === 403) {
      return err.error?.message || 'Invalid credentials or backend security rejected login.';
    }

    return err.error?.message || err.message || 'Login failed.';
  }
}
