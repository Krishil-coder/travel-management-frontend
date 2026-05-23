import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DepartmentSpend, MonthlyCost, ReportSummary } from '@core/models/report.model';
import { RequestStatus } from '@core/models/travel-request.model';
import { ReportService } from '@core/services/report.service';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './report.component.html'
})
export class ReportComponent {
  private readonly reportService = inject(ReportService);
  private readonly fb = inject(FormBuilder);
  summary: ReportSummary[] = [];
  departmentSpend: DepartmentSpend[] = [];
  monthlyCosts: MonthlyCost[] = [];
  employeeHistory: Array<{ employee: string; requestId: string; destination: string; status: string; cost: number; department: string; startDate: string }> = [];
  policyExceptions: Array<{ requestId: string; employee: string; severity: string; message: string }> = [];
  allEmployeeHistory: Array<{ employee: string; requestId: string; destination: string; status: string; cost: number; department: string; startDate: string }> = [];
  loading = true;
  message = '';
  departments: string[] = [];
  statuses: RequestStatus[] = ['DRAFT', 'SUBMITTED', 'MANAGER_APPROVED', 'MANAGER_REJECTED', 'FINANCE_APPROVED', 'FINANCE_REJECTED', 'COMPLETED', 'REIMBURSED'];
  filterForm = this.fb.nonNullable.group({
    startDate: [''],
    endDate: [''],
    department: [''],
    status: ['']
  });

  constructor() {
    this.reportService.getReportData().subscribe({
      next: (data) => {
        this.summary = data.summary;
        this.departmentSpend = data.departmentSpend;
        this.monthlyCosts = data.monthlyCosts;
        this.allEmployeeHistory = data.employeeHistory;
        this.employeeHistory = data.employeeHistory;
        this.departments = data.departmentSpend.map((row) => row.department);
        this.policyExceptions = data.policyExceptions;
        this.loading = false;
      },
      error: () => {
        this.message = 'Unable to load reports.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    const value = this.filterForm.getRawValue();
    this.employeeHistory = this.allEmployeeHistory.filter((item) => {
      const matchesStatus = !value.status || item.status === value.status;
      const matchesDepartment = !value.department || item.department === value.department;
      const matchesStartDate = !value.startDate || new Date(item.startDate) >= new Date(value.startDate);
      const matchesEndDate = !value.endDate || new Date(item.startDate) <= new Date(value.endDate);
      return matchesStatus && matchesDepartment && matchesStartDate && matchesEndDate;
    });
  }

  clearFilters(): void {
    this.filterForm.reset({ startDate: '', endDate: '', department: '', status: '' });
    this.employeeHistory = this.allEmployeeHistory;
  }
}
