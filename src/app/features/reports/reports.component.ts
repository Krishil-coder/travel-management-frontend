import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReportService } from '@core/services/report.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html'
})
export class ReportsComponent {
  private readonly reportService = inject(ReportService);
  readonly summary = this.reportService.getSummary();
  readonly departmentSpend = this.reportService.getDepartmentSpend();
  readonly monthlyCosts = this.reportService.getMonthlyCosts();
}
