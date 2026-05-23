import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Policy } from '@core/models/policy.model';
import { AdminService } from '@core/services/admin.service';
import { AuditLogService } from '@core/services/audit-log.service';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-policies',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: './policies.component.html'
})
export class PoliciesComponent {
  private readonly adminService = inject(AdminService);
  private readonly auditLogService = inject(AuditLogService);

  message = '';
  policy: Policy = this.getEmptyPolicy();

  get policies(): Policy[] {
    return this.adminService.getPolicies();
  }

  toggleClass(value: Policy['allowedClasses'][number], checked: boolean): void {
    this.policy.allowedClasses = checked
      ? Array.from(new Set([...this.policy.allowedClasses, value]))
      : this.policy.allowedClasses.filter((item) => item !== value);
  }

  savePolicy(): void {
    if (!this.policy.title.trim() || this.policy.maxBudget <= 0 || this.policy.allowedClasses.length === 0) {
      this.message = 'Enter policy title, budget, and at least one travel class.';
      return;
    }

    this.policy.limit = `${this.policy.department} limit INR ${this.policy.maxBudget}; classes: ${this.policy.allowedClasses.join(', ')}`;
    this.adminService.savePolicy({ ...this.policy });
    this.auditLogService.record('Admin User', 'POLICY', `Created policy ${this.policy.title}`);
    this.message = 'Policy saved and available for request validation.';
    this.policy = this.getEmptyPolicy();
  }

  private getEmptyPolicy(): Policy {
    return {
      id: '',
      title: '',
      category: 'Budget',
      department: 'All',
      maxBudget: 100000,
      allowedClasses: ['Economy'],
      limit: '',
      status: 'Active'
    };
  }
}
