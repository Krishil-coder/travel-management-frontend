import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Expense } from '@core/models/expense.model';
import { ExpenseService } from '@core/services/expense.service';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-reimbursements',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: './reimbursements.component.html'
})
export class ReimbursementsComponent {
  private readonly expenseService = inject(ExpenseService);

  message = '';
  comments: Record<string, string> = {};
  pendingExpenses: Expense[] = [];
  loading = true;

  constructor() {
    this.refreshExpenses();
  }

  get pendingTotal(): number {
    return this.pendingExpenses.reduce((total, expense) => total + Number(expense.amount), 0);
  }

  markReimbursed(expense: Expense): void {
    this.expenseService.updateReimbursementStatus(expense.id, 'REIMBURSED', this.getComment(expense.id)).subscribe({
      next: () => this.afterAction(expense.id + ' marked as reimbursed.', expense.id),
      error: () => this.message = 'Could not update reimbursement.'
    });
  }

  reject(expense: Expense): void {
    if (!confirm('Reject this reimbursement?')) return;
    this.expenseService.updateReimbursementStatus(expense.id, 'REJECTED', this.getComment(expense.id)).subscribe({
      next: () => this.afterAction(expense.id + ' rejected.', expense.id),
      error: () => this.message = 'Could not update reimbursement.'
    });
  }

  private refreshExpenses(): void {
    this.loading = true;
    this.expenseService.getPendingExpenses().subscribe({
      next: (expenses) => {
        this.pendingExpenses = expenses;
        this.loading = false;
      },
      error: () => {
        this.message = 'Unable to load reimbursements.';
        this.loading = false;
      }
    });
  }

  private afterAction(message: string, id: string): void {
    this.message = message;
    this.clearComment(id);
    this.refreshExpenses();
  }

  private getComment(id: string): string {
    return this.comments[id]?.trim() ?? '';
  }

  private clearComment(id: string): void {
    delete this.comments[id];
  }
}
