import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Expense } from '@core/models/expense.model';
import { TravelRequest } from '@core/models/travel-request.model';
import { AuthService } from '@core/services/auth.service';
import { ExpenseService } from '@core/services/expense.service';
import { TravelRequestService } from '@core/services/travel-request.service';

@Component({
  selector: 'app-expense',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expense.component.html'
})
export class ExpenseComponent {
  private readonly authService = inject(AuthService);
  private readonly expenseService = inject(ExpenseService);
  private readonly travelRequestService = inject(TravelRequestService);
  private readonly fb = inject(FormBuilder);

  categories: Expense['category'][] = ['FOOD', 'STAY', 'TRANSPORT', 'OTHER'];
  message = '';
  loading = true;
  approvedRequests: TravelRequest[] = [];
  expenses: Expense[] = [];
  selectedFileName = '';

  expenseForm = this.fb.nonNullable.group({
    travelRequestId: ['', Validators.required],
    category: ['FOOD' as Expense['category'], Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    description: ['', Validators.required],
    proofFileName: ['']
  });

  constructor() {
    this.loadPage();
  }

  get totalExpenseAmount(): number {
    return this.expenses.reduce((total, expense) => total + Number(expense.amount), 0);
  }

  addExpense(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      this.message = 'Please complete all required expense fields.';
      return;
    }

    this.expenseService.addExpense(this.toExpense()).subscribe({
      next: () => {
        this.message = 'Expense submitted for finance reimbursement.';
        this.expenseForm.reset({ travelRequestId: '', category: 'FOOD', amount: 0, description: '', proofFileName: '' });
        this.selectedFileName = '';
        this.loadExpenses();
      },
      error: () => this.message = 'Could not submit expense.'
    });
  }

  onProofSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFileName = input.files?.[0]?.name ?? '';
    this.expenseForm.patchValue({ proofFileName: this.selectedFileName });
  }

  getStatusClass(status: Expense['reimbursementStatus']): string {
    if (status === 'REIMBURSED') return 'status-approved';
    if (status === 'REJECTED') return 'status-rejected';
    return 'status-pending';
  }

  private toExpense(): Expense {
    const user = this.authService.currentUser();
    const now = new Date().toISOString();
    const value = this.expenseForm.getRawValue();

    return {
    id: '',
    travelRequestId: value.travelRequestId,
    employeeId: user?.id ?? 0,
    employeeEmail: user?.email ?? '',
    employeeName: user?.name ?? '',
    category: value.category,
    amount: Number(value.amount),
    description: value.description,
    proofFileName: value.proofFileName,
    reimbursementStatus: 'PENDING',
    financeComment: '',
    createdAt: now,
    updatedAt: now
    };
  }

  private loadPage(): void {
    this.travelRequestService.getMyRequests().subscribe({
      next: (requests) => {
        this.approvedRequests = requests.filter((request) => request.status === 'FINANCE_APPROVED' || request.status === 'COMPLETED');
        this.loadExpenses();
      },
      error: () => {
        this.message = 'Unable to load approved requests.';
        this.loading = false;
      }
    });
  }

  private loadExpenses(): void {
    this.expenseService.getMyExpenses().subscribe({
      next: (expenses) => {
        this.expenses = expenses;
        this.loading = false;
      },
      error: () => {
        this.message = 'Unable to load expenses.';
        this.loading = false;
      }
    });
  }
}
