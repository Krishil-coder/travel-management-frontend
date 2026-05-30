import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AdminService,
  AdminUser,
  SaveAdminUser
} from '@core/services/admin.service';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

type AdminSortField = 'name' | 'email' | 'role' | 'department' | 'status';
type AdminRole = AdminUser['role'];

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusBadgeComponent
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly departments = [
    'Engineering',
    'Finance',
    'Human Resources',
    'Sales',
    'Operations'
  ];

  employees: AdminUser[] = [];
  employeeForm: SaveAdminUser = this.emptyEmployee();

  editingEmployeeId: number | null = null;
  loading = false;
  saving = false;
  message = '';

  searchText = '';
  selectedRole = 'ALL';
  selectedStatus = 'ALL';

  sortField: AdminSortField = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  pageNumber = 1;
  pageSize = 5;
  pageSizes = [5, 10, 20];

  ngOnInit(): void {
    this.loadEmployees();
  }

  refreshEmployees(): void {
    this.loadEmployees();
  }

  get activeEmployees(): number {
    return this.employees.filter(employee => employee.enabled).length;
  }

  get inactiveEmployees(): number {
    return this.employees.filter(employee => !employee.enabled).length;
  }

  get managerCount(): number {
    return this.employees.filter(employee => employee.role === 'MANAGER').length;
  }

  get managers(): AdminUser[] {
    return this.employees.filter(employee => employee.role === 'MANAGER' && employee.enabled);
  }

  get selectedDepartmentManager(): AdminUser | undefined {
    return this.getManagerForDepartment(this.employeeForm.department);
  }

  get managerDisplay(): string {
    if (!this.shouldAutoAssignManager()) {
      return 'No manager required for this role';
    }

    const manager = this.selectedDepartmentManager;

    if (!manager) {
      return 'No manager found for this department';
    }

    return `${manager.firstName} ${manager.lastName}`;
  }

  get filteredEmployees(): AdminUser[] {
    const search = this.searchText.trim().toLowerCase();

    return this.employees.filter(employee => {
      const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();

      const matchesSearch =
        !search ||
        fullName.includes(search) ||
        employee.email.toLowerCase().includes(search) ||
        employee.department.toLowerCase().includes(search);

      const matchesRole =
        this.selectedRole === 'ALL' ||
        employee.role === this.selectedRole;

      const matchesStatus =
        this.selectedStatus === 'ALL' ||
        (this.selectedStatus === 'ACTIVE' && employee.enabled) ||
        (this.selectedStatus === 'INACTIVE' && !employee.enabled);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  get sortedEmployees(): AdminUser[] {
    return [...this.filteredEmployees].sort((first, second) => {
      const firstValue = this.getSortValue(first);
      const secondValue = this.getSortValue(second);

      if (firstValue < secondValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }

      if (firstValue > secondValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }

      return 0;
    });
  }

  get pagedEmployees(): AdminUser[] {
    const startIndex = (this.pageNumber - 1) * this.pageSize;
    return this.sortedEmployees.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.filteredEmployees.length / this.pageSize)
    );
  }

  get pageStart(): number {
    if (this.filteredEmployees.length === 0) {
      return 0;
    }

    return (this.pageNumber - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(
      this.pageNumber * this.pageSize,
      this.filteredEmployees.length
    );
  }

  sortBy(field: AdminSortField): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.goToFirstPage();
  }

  onDepartmentChange(department: string): void {
    this.employeeForm.department = department;
    this.applyDepartmentManager();
  }

  onRoleChange(role: AdminRole): void {
    this.employeeForm.role = role;
    this.applyDepartmentManager();
  }

  getSortMark(field: AdminSortField): string {
    if (this.sortField !== field) {
      return '';
    }

    return this.sortDirection === 'asc' ? '^' : 'v';
  }

  goToFirstPage(): void {
    this.pageNumber = 1;
  }

  previousPage(): void {
    if (this.pageNumber > 1) {
      this.pageNumber--;
    }
  }

  nextPage(): void {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
    }
  }

  saveEmployee(): void {
    if (!this.isFormValid()) {
      return;
    }

    this.saving = true;
    this.message = '';

    const request = this.editingEmployeeId
      ? this.adminService.updateUser(this.editingEmployeeId, this.employeeForm)
      : this.adminService.createUser(this.employeeForm);

    request.subscribe({
      next: () => this.afterSaveSuccess(),
      error: (error) => this.afterSaveError(error)
    });
  }

  editEmployee(employee: AdminUser): void {
    this.editingEmployeeId = employee.id;
    this.employeeForm = {
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      password: '',
      role: employee.role,
      department: employee.department,
      managerId: employee.managerId,
      enabled: employee.enabled
    };
    this.applyDepartmentManager();
  }

  deleteEmployee(employee: AdminUser): void {
    const employeeName = `${employee.firstName} ${employee.lastName}`;

    if (!confirm(`Delete ${employeeName}?`)) {
      return;
    }

    this.adminService.removeUser(employee.id).subscribe({
      next: () => {
        this.message = 'Deleted successfully';
        this.loadEmployees();
      },
      error: () => {
        this.message = 'Delete failed';
      }
    });
  }

  cancelEdit(): void {
    this.editingEmployeeId = null;
    this.employeeForm = this.emptyEmployee();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedRole = 'ALL';
    this.selectedStatus = 'ALL';
    this.goToFirstPage();
  }

  private loadEmployees(): void {
    this.loading = true;

    this.adminService.listUsers().subscribe({
      next: (users) => {
        this.employees = users;
        this.applyDepartmentManager();
        this.goToFirstPage();
        this.loading = false;
      },
      error: () => {
        this.employees = [];
        this.loading = false;
        this.message = 'Unable to load';
      }
    });
  }

  private isFormValid(): boolean {
    if (
      !this.employeeForm.firstName.trim() ||
      !this.employeeForm.lastName.trim() ||
      !this.employeeForm.email.trim() ||
      !this.employeeForm.department.trim()
    ) {
      this.message = 'Required fields missing';
      return false;
    }

    if (!this.editingEmployeeId && !this.employeeForm.password?.trim()) {
      this.message = 'Password required';
      return false;
    }

    if (this.shouldAutoAssignManager() && !this.employeeForm.managerId) {
      this.message = 'Create an active manager for this department first.';
      return false;
    }

    return true;
  }

  private afterSaveSuccess(): void {
    this.saving = false;
    this.message = this.editingEmployeeId
      ? 'Updated successfully'
      : 'Added successfully';

    this.cancelEdit();
    this.loadEmployees();
  }

  private afterSaveError(error: any): void {
    this.saving = false;
    this.message = this.getErrorMessage(error);
  }

  private getErrorMessage(error: any): string {
    if (error?.status === 0) {
      return 'Backend is not running. Start Spring Boot on port 8080, then try again.';
    }

    if (typeof error?.error === 'string' && error.error.trim()) {
      return error.error;
    }

    return error?.error?.message || error?.message || 'Save failed';
  }

  private emptyEmployee(): SaveAdminUser {
    return {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      department: this.departments[0],
      managerId: null,
      enabled: true
    };
  }

  private applyDepartmentManager(): void {
    if (!this.shouldAutoAssignManager()) {
      this.employeeForm.managerId = null;
      return;
    }

    this.employeeForm.managerId = this.selectedDepartmentManager?.id ?? null;
  }

  private shouldAutoAssignManager(): boolean {
    return this.employeeForm.role === 'EMPLOYEE' || this.employeeForm.role === 'FINANCE';
  }

  private getManagerForDepartment(department: string): AdminUser | undefined {
    return this.managers.find(manager => manager.department === department);
  }

  private getSortValue(employee: AdminUser): string {
    if (this.sortField === 'name') {
      return `${employee.firstName} ${employee.lastName}`.toLowerCase();
    }

    if (this.sortField === 'status') {
      return employee.enabled ? 'active' : 'inactive';
    }

    return String(employee[this.sortField] ?? '').toLowerCase();
  }
}
