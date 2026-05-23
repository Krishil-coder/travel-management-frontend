import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser, SaveAdminUser } from '@core/services/admin.service';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: './users.component.html'
})
export class UsersComponent {
  private readonly adminService = inject(AdminService);

  readonly users = this.adminService.getUsers();
  readonly roles: AdminUser['role'][] = ['EMPLOYEE', 'MANAGER', 'FINANCE', 'ADMIN'];
  readonly statuses: AdminUser['status'][] = ['ACTIVE', 'INACTIVE'];

  editingUserId: number | null = null;
  message = '';
  userForm: SaveAdminUser = this.emptyUser();

  saveUser(): void {
    if (!this.userForm.name.trim() || !this.userForm.email.trim() || !this.userForm.department.trim()) {
      this.message = 'Name, email, and department are required.';
      return;
    }

    if (!this.editingUserId && !this.userForm.password?.trim()) {
      this.message = 'Password is required for new employees.';
      return;
    }

    const request = this.editingUserId
      ? this.adminService.updateUser(this.editingUserId, this.userForm)
      : this.adminService.createUser(this.userForm);

    request.subscribe({
      next: () => {
        this.message = this.editingUserId ? 'User updated.' : 'User added.';
        this.cancelEdit();
      },
      error: (error) => {
        this.message = error.status === 0
          ? 'Backend is not running. Start Spring Boot on port 8080, then try again.'
          : error.error?.message || 'Unable to save user.';
      }
    });
  }

  editUser(user: AdminUser): void {
    this.editingUserId = user.id;
    this.userForm = {
      name: user.name,
      email: user.email,
      password: '',
      department: user.department,
      role: user.role,
      manager: user.manager || '',
      status: user.status
    };
  }

  removeUser(user: AdminUser): void {
    if (!confirm(`Remove ${user.name}?`)) {
      return;
    }

    this.adminService.removeUser(user.id).subscribe({
      next: () => {
        this.message = `${user.name} removed.`;
      },
      error: () => {
        this.message = 'Unable to remove user.';
      }
    });
  }

  cancelEdit(): void {
    this.editingUserId = null;
    this.userForm = this.emptyUser();
  }

  private emptyUser(): SaveAdminUser {
    return {
      name: '',
      email: '',
      password: '',
      department: '',
      role: 'EMPLOYEE',
      manager: '',
      status: 'ACTIVE'
    };
  }
}
