import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Expense } from '@core/models/expense.model';
import { TravelRequest } from '@core/models/travel-request.model';
import { AuthService } from '@core/services/auth.service';
import { ExpenseService } from '@core/services/expense.service';
import { TravelRequestService } from '@core/services/travel-request.service';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StatusBadgeComponent],
  templateUrl: './expenses.component.html'
})
export class ExpensesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly expenseService = inject(ExpenseService);
  private readonly travelRequestService = inject(TravelRequestService);
  message = '';
  approvedRequests: TravelRequest[] = [];
  expenses: Expense[] = [];
  readonly segmentTypes = ['Flight', 'Train', 'Cab', 'Hotel', 'Meal', 'Other'];
  expenseForm = this.fb.nonNullable.group({
    travelRequestId: ['', Validators.required],
    category: ['FOOD' as Expense['category'], Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    segmentType: ['', Validators.required],
    fromLocation: ['', Validators.required],
    toLocation: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    note: [''],
    proofFileName: ['']
  });

  constructor() {
    this.loadData();
  }

  addExpense(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    const user = this.authService.currentUser();
    const value = this.expenseForm.getRawValue();
    const now = new Date().toISOString();
    const expense: Expense = {
      id: '',
      travelRequestId: value.travelRequestId,
      employeeId: user?.id ?? 0,
      employeeEmail: user?.email ?? '',
      employeeName: user?.name ?? '',
      category: value.category as Expense['category'],
      amount: Number(value.amount),
      segmentType: value.segmentType,
      fromLocation: value.fromLocation,
      toLocation: value.toLocation,
      startTime: value.startTime,
      endTime: value.endTime,
      description: value.note,
      proofFileName: value.proofFileName,
      reimbursementStatus: 'PENDING',
      financeComment: '',
      createdAt: now,
      updatedAt: now
    };

    this.expenseService.addExpense(expense).subscribe({
      next: () => {
        this.message = 'Expense submitted for reimbursement.';
        this.expenseForm.reset({
          travelRequestId: '',
          category: 'FOOD',
          amount: 0,
          segmentType: '',
          fromLocation: '',
          toLocation: '',
          startTime: '',
          endTime: '',
          note: '',
          proofFileName: ''
        });
        this.loadData();
      },
      error: () => this.message = 'Could not submit expense.'
    });
  }

  private loadData(): void {
    this.travelRequestService.getMyRequests().subscribe({
      next: (requests) => this.approvedRequests = requests.filter((request) => request.status === 'FINANCE_APPROVED' || request.status === 'COMPLETED'),
      error: () => this.approvedRequests = []
    });

    this.expenseService.getMyExpenses().subscribe({
      next: (expenses) => this.expenses = expenses,
      error: () => this.expenses = []
    });
  }
}
