import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);

  name = '';
  email = '';
  department = '';
  message = '';

  register(): void {
    if (!this.name || !this.email || !this.department) {
      this.message = 'Please fill all fields.';
      return;
    }

    this.authService.register(this.name, this.email, this.department);
  }
}
