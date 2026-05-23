import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { DepartmentSpend, MonthlyCost, ReportSummary } from '../models/report.model';
import { Expense } from '../models/expense.model';
import { TravelRequest } from '../models/travel-request.model';
import { ExpenseService } from './expense.service';
import { TravelRequestService } from './travel-request.service';

export interface ReportData {
  summary: ReportSummary[];
  departmentSpend: DepartmentSpend[];
  monthlyCosts: MonthlyCost[];
  employeeHistory: Array<{ employee: string; requestId: string; destination: string; status: string; cost: number; department: string; startDate: string }>;
  policyExceptions: Array<{ requestId: string; employee: string; severity: string; message: string }>;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly requestService = inject(TravelRequestService);
  private readonly expenseService = inject(ExpenseService);

  getReportData(): Observable<ReportData> {
    return forkJoin({
      requests: this.requestService.getRequests(),
      expenses: this.expenseService.getExpenses()
    }).pipe(
      map(({ requests, expenses }) => ({
        summary: this.getSummary(requests, expenses),
        departmentSpend: this.getDepartmentSpend(requests),
        monthlyCosts: this.getMonthlyCosts(requests),
        employeeHistory: this.getEmployeeHistory(requests),
        policyExceptions: this.getPolicyExceptions(requests)
      }))
    );
  }

  private getSummary(requests: TravelRequest[], expenses: Expense[]): ReportSummary[] {
    const approvedStatuses: TravelRequest['status'][] = ['FINANCE_APPROVED', 'COMPLETED', 'REIMBURSED'];
    const approvedSpend = requests
      .filter((request) => approvedStatuses.includes(request.status))
      .reduce((total, request) => total + Number(request.estimatedCost), 0);
    const policyExceptions = requests.reduce((total, request) => total + (request.policyViolations?.length ?? 0), 0);

    return [
      { label: 'Approved Travel Budget', value: this.formatInr(approvedSpend), trend: `${requests.filter((request) => approvedStatuses.includes(request.status)).length} approved trips` },
      { label: 'Submitted Expenses', value: this.formatInr(expenses.reduce((total, expense) => total + Number(expense.amount), 0)), trend: `${expenses.length} expense entries` },
      { label: 'Policy Exceptions', value: String(policyExceptions), trend: 'Budget and travel class checks' }
    ];
  }

  private getDepartmentSpend(requests: TravelRequest[]): DepartmentSpend[] {
    const rows = new Map<string, DepartmentSpend>();

    for (const request of requests) {
      const current = rows.get(request.department) ?? { department: request.department, trips: 0, spend: 0 };
      current.trips += 1;
      current.spend += Number(request.estimatedCost);
      rows.set(request.department, current);
    }

    return Array.from(rows.values()).sort((a, b) => b.spend - a.spend);
  }

  private getMonthlyCosts(requests: TravelRequest[]): MonthlyCost[] {
    const rows = new Map<string, MonthlyCost>();

    for (const request of requests) {
      const date = new Date(request.startDate || request.createdAt);
      const month = date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
      const current = rows.get(month) ?? { month, requests: 0, cost: 0 };
      current.requests += 1;
      current.cost += Number(request.estimatedCost);
      rows.set(month, current);
    }

    return Array.from(rows.values());
  }

  private getEmployeeHistory(requests: TravelRequest[]) {
    return requests.map((request) => ({
      employee: request.employeeName,
      requestId: request.id,
      destination: request.destination,
      status: request.status,
      cost: request.estimatedCost,
      department: request.department,
      startDate: request.startDate
    }));
  }

  private getPolicyExceptions(requests: TravelRequest[]) {
    return requests
      .filter((request) => (request.policyViolations?.length ?? 0) > 0)
      .flatMap((request) =>
        (request.policyViolations ?? []).map((violation) => ({
          requestId: request.id,
          employee: request.employeeName,
          severity: violation.severity,
          message: violation.message
        }))
      );
  }

  private formatInr(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  }
}
