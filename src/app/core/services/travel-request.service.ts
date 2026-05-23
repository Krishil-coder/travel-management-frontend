import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TravelRequest } from '../models/travel-request.model';

@Injectable({
  providedIn: 'root'
})
export class TravelRequestService {

  private readonly http = inject(HttpClient);

  private readonly baseUrl = 'http://localhost:8080/api/requests';

  getRequests(): Observable<TravelRequest[]> {
    return this.http.get<TravelRequest[]>(this.baseUrl);
  }

  getRequestById(id: string): Observable<TravelRequest> {
    return this.http.get<TravelRequest>(`${this.baseUrl}/${id}`);
  }

  getMyRequests(): Observable<TravelRequest[]> {
    return this.http.get<TravelRequest[]>(`${this.baseUrl}/my`);
  }

  saveDraft(request: TravelRequest): Observable<TravelRequest> {
    const payload = this.buildPayload(request);

    console.log('SAVE DRAFT URL:', this.baseUrl);
    console.log('SAVE DRAFT PAYLOAD:', payload);

    return this.http.post<TravelRequest>(this.baseUrl, payload);
  }

  submitRequest(request: TravelRequest): Observable<TravelRequest> {
    const payload = this.buildPayload(request);

    console.log('SUBMIT URL:', this.baseUrl);
    console.log('SUBMIT PAYLOAD:', payload);

    return this.http.post<TravelRequest>(this.baseUrl, payload);
  }

  updateDraft(request: TravelRequest): Observable<TravelRequest> {
    const payload = this.buildPayload(request);

    return this.http.put<TravelRequest>(
      `${this.baseUrl}/${request.id}`,
      payload
    );
  }

  submitDraft(id: string): Observable<TravelRequest> {
    return this.http.post<TravelRequest>(
      `${this.baseUrl}/${id}/submit`,
      {}
    );
  }

  deleteDraft(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getManagerApprovals(): Observable<TravelRequest[]> {
    return this.http.get<TravelRequest[]>(
      'http://localhost:8080/api/approvals/manager'
    );
  }

  getFinanceApprovals(): Observable<TravelRequest[]> {
    return this.http.get<TravelRequest[]>(
      'http://localhost:8080/api/approvals/finance'
    );
  }

  approveByManager(
    request: TravelRequest,
    comment: string
  ): Observable<TravelRequest> {
    return this.http.post<TravelRequest>(
      `${this.baseUrl}/${request.id}/manager-approval`,
      {
        action: 'APPROVED',
        comment
      }
    );
  }

  rejectByManager(
    request: TravelRequest,
    comment: string
  ): Observable<TravelRequest> {
    return this.http.post<TravelRequest>(
      `${this.baseUrl}/${request.id}/manager-approval`,
      {
        action: 'REJECTED',
        comment
      }
    );
  }

  approveByFinance(
    request: TravelRequest,
    comment: string
  ): Observable<TravelRequest> {
    return this.http.post<TravelRequest>(
      `${this.baseUrl}/${request.id}/finance-approval`,
      {
        action: 'APPROVED',
        comment
      }
    );
  }

  rejectByFinance(
    request: TravelRequest,
    comment: string
  ): Observable<TravelRequest> {
    return this.http.post<TravelRequest>(
      `${this.baseUrl}/${request.id}/finance-approval`,
      {
        action: 'REJECTED',
        comment
      }
    );
  }

  markReimbursed(id: string): Observable<TravelRequest> {
    return this.http.post<TravelRequest>(
      `${this.baseUrl}/${id}/reimburse`,
      {}
    );
  }

  private buildPayload(request: TravelRequest) {
    return {
      employeeId: Number(request.employeeId || 1),
      destination: request.destination?.trim(),
      travelClass: request.travelClass,
      startDate: request.startDate,
      endDate: request.endDate,
      estimatedCost: Number(request.estimatedCost),
      purpose: request.purpose?.trim()
    };
  }
}