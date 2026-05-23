import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  message = '';
  loading = false;

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
        this.message = err.status === 0 
          ? 'Cannot connect to backend. Is Spring Boot running on port 8080?'
          : err.error?.message || 'Invalid credentials or login failed.';
      }
    });
  }
}
