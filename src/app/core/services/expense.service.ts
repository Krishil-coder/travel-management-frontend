import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Expense, ReimbursementStatus } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/expenses`;

  getExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(this.baseUrl);
  }

  getMyExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.baseUrl}/my`);
  }

  getPendingExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.baseUrl}/pending`);
  }

  addExpense(expense: Expense): Observable<Expense> {
    return this.http.post<Expense>(this.baseUrl, expense);
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
}
