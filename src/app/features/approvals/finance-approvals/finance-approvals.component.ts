import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Expense } from '@core/models/expense.model';
import { ExpenseService } from '@core/services/expense.service';
import {
  FinanceRequestDetailsResponse,
  TravelRequestService
} from '@core/services/travel-request.service';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-finance-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: './finance-approvals.component.html'
})
export class FinanceApprovalsComponent {
  private readonly travelRequestService = inject(TravelRequestService);
  private readonly expenseService = inject(ExpenseService);
  readonly maxCommentLength = 1000;
  message = '';
  comment = '';
  expenseComments: Record<string, string> = {};
  approvals: FinanceRequestDetailsResponse[] = [];
  expenses: Expense[] = [];

  constructor() {
    this.refresh();
    this.refreshExpenses();
  }

  approve(request: FinanceRequestDetailsResponse): void {
    if (!this.canSubmitFinanceDecision(request)) {
      return;
    }

    this.travelRequestService.approveByFinance(request, this.comment.trim()).subscribe({
      next: () => this.afterAction(`${request.requestId} approved.`),
      error: (error) => this.message = error?.message || 'Could not approve request.'
    });
  }

  reject(request: FinanceRequestDetailsResponse): void {
    if (!this.canSubmitFinanceDecision(request)) {
      return;
    }

    this.travelRequestService.rejectByFinance(request, this.comment.trim()).subscribe({
      next: () => this.afterAction(`${request.requestId} rejected.`),
      error: (error) => this.message = error?.message || 'Could not reject request.'
    });
  }

  approveExpense(expense: Expense): void {
    this.expenseService.updateReimbursementStatus(expense.id, 'APPROVED', this.getExpenseComment(expense.id)).subscribe({
      next: () => this.afterExpenseAction(`${expense.id} approved.`, expense.id),
      error: () => this.message = 'Could not approve expense.'
    });
  }

  reimburseExpense(expense: Expense): void {
    this.expenseService.updateReimbursementStatus(expense.id, 'REIMBURSED', this.getExpenseComment(expense.id)).subscribe({
      next: () => {
        this.afterExpenseAction(`${expense.id} reimbursed.`, expense.id);
        this.completeRequestIfReady(expense.travelRequestId);
      },
      error: () => this.message = 'Could not reimburse expense.'
    });
  }

  rejectExpense(expense: Expense): void {
    this.expenseService.updateReimbursementStatus(expense.id, 'REJECTED', this.getExpenseComment(expense.id)).subscribe({
      next: () => this.afterExpenseAction(`${expense.id} rejected.`, expense.id),
      error: () => this.message = 'Could not reject expense.'
    });
  }

  private refresh(): void {
    this.travelRequestService.getFinanceApprovals().subscribe({
      next: (approvals) => this.approvals = approvals,
      error: (error) => {
        this.approvals = [];
        this.message = error?.message || 'Unable to load finance approvals.';
      }
    });
  }

  private refreshExpenses(): void {
    this.expenseService.getPendingExpenses().subscribe({
      next: (expenses) => this.expenses = expenses,
      error: () => this.expenses = []
    });
  }

  private afterAction(message: string): void {
    this.message = message;
    this.comment = '';
    this.refresh();
  }

  private afterExpenseAction(message: string, expenseId: string): void {
    this.message = message;
    delete this.expenseComments[expenseId];
    this.refreshExpenses();
  }

  private getExpenseComment(expenseId: string): string {
    return this.expenseComments[expenseId]?.trim() ?? '';
  }

  private canSubmitFinanceDecision(request: FinanceRequestDetailsResponse): boolean {
    if (!this.travelRequestService.getCurrentFinanceId()) {
      this.message = 'Logged-in finance user id is required.';
      return false;
    }

    if (!request.requestId) {
      this.message = 'Travel request id is required.';
      return false;
    }

    if (this.comment.length > this.maxCommentLength) {
      this.message = `Comments must be ${this.maxCommentLength} characters or fewer.`;
      return false;
    }

    return true;
  }

  private completeRequestIfReady(requestId: string): void {
    this.expenseService.getExpenses().subscribe({
      next: (expenses) => {
        const requestExpenses = expenses.filter((expense) => expense.travelRequestId === requestId);
        const allReimbursed = requestExpenses.length > 0 &&
          requestExpenses.every((expense) => expense.reimbursementStatus === 'REIMBURSED');

        if (!allReimbursed) {
          return;
        }

        this.travelRequestService.getRequestById(requestId).subscribe({
          next: (request) => {
            this.travelRequestService.updateRequest({ ...request, status: 'COMPLETED' }).subscribe({
              next: () => this.refresh(),
              error: () => this.message = 'Expense reimbursed, but request completion failed.'
            });
          }
        });
      }
    });
  }
}
