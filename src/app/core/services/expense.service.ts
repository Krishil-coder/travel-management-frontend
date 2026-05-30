import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Expense, ReimbursementStatus } from '../models/expense.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/expenses`;

  getExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[] | { data: Expense[] }>(this.baseUrl).pipe(
      map((response) => Array.isArray(response) ? response : response.data)
    );
  }

  getMyExpenses(): Observable<Expense[]> {
    return this.getExpenses().pipe(
      map((expenses) => expenses.filter((expense) => Number(expense.employeeId) === this.employeeId))
    );
  }

  getPendingExpenses(): Observable<Expense[]> {
    return this.getExpenses().pipe(
      map((expenses) => expenses.filter((expense) => expense.reimbursementStatus === 'PENDING' || expense.reimbursementStatus === 'APPROVED'))
    );
  }

  addExpense(expense: Expense): Observable<Expense> {
    return this.http.post<Expense | { data: Expense }>(this.baseUrl, {
      ...expense,
      employeeId: this.employeeId
    }).pipe(
      map((response) => 'data' in response ? response.data : response)
    );
  }

  updateReimbursementStatus(
    id: string,
    reimbursementStatus: ReimbursementStatus,
    financeComment = ''
  ): Observable<{ id: string; reimbursementStatus: string }> {
    return this.http.patch<{ id: string; reimbursementStatus: string }>(`${this.baseUrl}/${id}/reimbursement`, {
      reimbursementStatus,
      financeComment
    });
  }

  private get employeeId(): number {
    return this.authService.currentUserId();
  }
}
