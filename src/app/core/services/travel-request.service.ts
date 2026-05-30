import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TravelRequest } from '../models/travel-request.model';
import { AuthService } from './auth.service';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ManagerRequestDetailsResponse {
  requestId: number;
  employeeName: string;
  department: string;
  destination: string;
  travelClass: string;
  startDate: string;
  endDate: string;
  estimatedCost: number;
  purpose: string;
  managerApproverName?: string;
  managerComments?: string;
  status: string;
}

export interface FinanceRequestDetailsResponse {
  requestId: number;
  employeeName: string;
  department: string;
  destination: string;
  travelClass: string;
  startDate: string;
  endDate: string;
  estimatedCost: number;
  purpose: string;
  managerApproverName: string;
  managerComments: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class TravelRequestService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly baseUrl = `${environment.apiUrl}/requests`;
  private readonly managerBaseUrl = `${environment.apiUrl}/manager`;
  private readonly financerBaseUrl = `${environment.apiUrl}/financer`;
  private readonly maxApprovalCommentLength = 1000;

  getRequests(): Observable<TravelRequest[]> {
    return this.http.get<TravelRequest[] | ApiResponse<TravelRequest[]>>(this.baseUrl).pipe(
      map((response) => this.normalizeRequestsResponse(response))
    );
  }

  getRequestById(id: string): Observable<TravelRequest> {
    return this.http.get<TravelRequest | ApiResponse<TravelRequest>>(`${this.baseUrl}/${id}`).pipe(
      map((response) => this.normalizeRequestResponse(response))
    );
  }

  getManagerRequestById(id: string): Observable<ManagerRequestDetailsResponse> {
    return this.http
      .get<ApiResponse<ManagerRequestDetailsResponse>>(
        `${this.managerBaseUrl}/requests/${encodeURIComponent(id)}`
      )
      .pipe(map((response) => response.data));
  }

  getMyRequests(): Observable<TravelRequest[]> {
    return this.getRequests().pipe(
      map((requests) => requests.filter((request) => Number(request.employeeId) === this.employeeId))
    );
  }

  saveDraft(request: TravelRequest): Observable<TravelRequest> {
    const payload = this.buildPayload(request);

    return this.http.post<TravelRequest | ApiResponse<TravelRequest>>(this.baseUrl, payload).pipe(
      map((response) => this.normalizeRequestResponse(response))
    );
  }

  submitRequest(request: TravelRequest): Observable<TravelRequest> {
    return this.saveDraft(request).pipe(
      switchMap((savedRequest) => this.submitDraft(savedRequest.id))
    );
  }

  updateRequest(request: TravelRequest): Observable<TravelRequest> {
    const payload = this.buildPayload(request);

    return this.http.put<TravelRequest | ApiResponse<TravelRequest>>(
      `${this.baseUrl}/${request.id}`,
      payload
    ).pipe(
      map((response) => this.normalizeRequestResponse(response))
    );
  }

  updateDraft(request: TravelRequest): Observable<TravelRequest> {
    const payload = this.buildDraftPayload(request);

    return this.http.put<TravelRequest | ApiResponse<TravelRequest>>(
      `${this.baseUrl}/${request.id}`,
      payload
    ).pipe(
      map((response) => this.normalizeRequestResponse(response))
    );
  }

  submitDraft(id: string): Observable<TravelRequest> {
    return this.http.post<TravelRequest | ApiResponse<TravelRequest>>(
      `${this.baseUrl}/${id}/submit`,
      {}
    ).pipe(
      map((response) => this.normalizeRequestResponse(response))
    );
  }

  deleteDraft(request: TravelRequest): Observable<void> {
    if (!request.id) {
      return throwError(() => new Error('Draft request id is required.'));
    }

    if (request.status !== 'DRAFT') {
      return throwError(() => new Error('Only draft requests can be deleted.'));
    }

    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(request.id)}`);
  }

  getManagerApprovals(): Observable<ManagerRequestDetailsResponse[]> {
    return this.http
      .get<ManagerRequestDetailsResponse[] | ApiResponse<ManagerRequestDetailsResponse[]>>(
        `${this.managerBaseUrl}/${this.managerId}/requests/pending`
      )
      .pipe(
        map((response) => this.normalizeManagerRequestsResponse(response)),
        catchError(() => this.getRequests().pipe(
          map((requests) => requests
            .filter((request) => request.status === 'SUBMITTED')
            .map((request) => this.toManagerRequestDetails(request))
          )
        ))
      );
  }

  approveByManager(
    request: ManagerRequestDetailsResponse,
    comment: string
  ): Observable<ManagerRequestDetailsResponse> {
    return this.http.put<ApiResponse<ManagerRequestDetailsResponse>>(
      `${this.managerBaseUrl}/requests/${request.requestId}/approve`,
      {
        managerId: this.managerId,
        comments: comment || 'Approved'
      }
    ).pipe(
      map((response) => response.data)
    );
  }

  rejectByManager(
    request: ManagerRequestDetailsResponse,
    comment: string
  ): Observable<ManagerRequestDetailsResponse> {
    return this.http.put<ApiResponse<ManagerRequestDetailsResponse>>(
      `${this.managerBaseUrl}/requests/${request.requestId}/reject`,
      {
        managerId: this.managerId,
        comments: comment || 'Rejected'
      }
    ).pipe(
      map((response) => response.data)
    );
  }

  getFinanceApprovals(): Observable<FinanceRequestDetailsResponse[]> {
    const financeId = this.financeId;

    if (!financeId) {
      return throwError(() => new Error('Logged-in finance user id is required.'));
    }

    return this.http
      .get<FinanceRequestDetailsResponse[] | ApiResponse<FinanceRequestDetailsResponse[]>>(
        `${this.financerBaseUrl}/${financeId}/requests/pending`
      )
      .pipe(
        map((response) => this.normalizeFinanceRequestsResponse(response)),
        catchError(() => this.getFinanceApprovalsFallback())
      );
  }

  getCurrentFinanceId(): number | null {
    return this.financeId;
  }

  getFinanceRequestById(requestId: number | string): Observable<FinanceRequestDetailsResponse> {
    const normalizedRequestId = this.normalizeApprovalRequestId(requestId);

    if (!normalizedRequestId) {
      return throwError(() => new Error('Travel request id is required.'));
    }

    return this.http
      .get<FinanceRequestDetailsResponse | ApiResponse<FinanceRequestDetailsResponse>>(
        `${this.financerBaseUrl}/requests/${normalizedRequestId}`
      )
      .pipe(
        map((response) => this.normalizeFinanceRequestResponse(response))
      );
  }

  approveByFinance(
    request: FinanceRequestDetailsResponse,
    comment: string
  ): Observable<FinanceRequestDetailsResponse> {
    const validationError = this.getFinanceApprovalValidationError(request, comment);

    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    return this.http.put<ApiResponse<FinanceRequestDetailsResponse>>(
      `${this.financerBaseUrl}/requests/${request.requestId}/approve`,
      this.buildFinanceApprovalPayload(comment || 'Approved')
    ).pipe(
      map((response) => this.normalizeFinanceRequestResponse(response))
    );
  }

  rejectByFinance(
    request: FinanceRequestDetailsResponse,
    comment: string
  ): Observable<FinanceRequestDetailsResponse> {
    const validationError = this.getFinanceApprovalValidationError(request, comment);

    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    return this.http.put<ApiResponse<FinanceRequestDetailsResponse>>(
      `${this.financerBaseUrl}/requests/${request.requestId}/reject`,
      this.buildFinanceApprovalPayload(comment || 'Rejected')
    ).pipe(
      map((response) => this.normalizeFinanceRequestResponse(response))
    );
  }

  cancelRequest(id: string): Observable<TravelRequest> {
    return this.http.post<TravelRequest | ApiResponse<TravelRequest>>(
      `${this.baseUrl}/${id}/cancel`,
      {}
    ).pipe(
      map((response) => this.normalizeRequestResponse(response))
    );
  }

  private normalizeRequestsResponse(
    response: TravelRequest[] | ApiResponse<TravelRequest[]>
  ): TravelRequest[] {
    const requests = Array.isArray(response) ? response : response.data;
    return (requests || []).map((request) => this.normalizeRequest(request));
  }

  private normalizeRequestResponse(
    response: TravelRequest | ApiResponse<TravelRequest>
  ): TravelRequest {
    return this.normalizeRequest('data' in response ? response.data : response);
  }

  private normalizeRequest(request: TravelRequest): TravelRequest {
    const apiRequest = request as TravelRequest & { requestId?: string; _id?: string };

    return {
      ...request,
      id: String(request.id || apiRequest.requestId || apiRequest._id || '')
    };
  }

  private normalizeManagerRequestsResponse(
    response: ManagerRequestDetailsResponse[] | ApiResponse<ManagerRequestDetailsResponse[]>
  ): ManagerRequestDetailsResponse[] {
    const requests = Array.isArray(response) ? response : response.data;
    return (requests || []).map((request) => this.normalizeManagerRequest(request));
  }

  private normalizeManagerRequest(request: ManagerRequestDetailsResponse): ManagerRequestDetailsResponse {
    const apiRequest = request as ManagerRequestDetailsResponse & { id?: string | number };

    return {
      ...request,
      requestId: Number(request.requestId || apiRequest.id)
    };
  }

  private normalizeFinanceRequestsResponse(
    response: FinanceRequestDetailsResponse[] | ApiResponse<FinanceRequestDetailsResponse[]>
  ): FinanceRequestDetailsResponse[] {
    const requests = Array.isArray(response) ? response : response.data;
    return (requests || []).map((request) => this.normalizeFinanceRequest(request));
  }

  private normalizeFinanceRequestResponse(
    response: FinanceRequestDetailsResponse | ApiResponse<FinanceRequestDetailsResponse>
  ): FinanceRequestDetailsResponse {
    return this.normalizeFinanceRequest('data' in response ? response.data : response);
  }

  private normalizeFinanceRequest(request: FinanceRequestDetailsResponse): FinanceRequestDetailsResponse {
    const apiRequest = request as FinanceRequestDetailsResponse & {
      id?: string | number;
      requestId?: string | number;
      managerApproverName?: string | null;
      managerComments?: string | null;
    };

    return {
      ...request,
      requestId: Number(apiRequest.requestId || apiRequest.id),
      managerApproverName: apiRequest.managerApproverName ?? '',
      managerComments: apiRequest.managerComments ?? ''
    };
  }

  private getFinanceApprovalsFallback(): Observable<FinanceRequestDetailsResponse[]> {
    return this.getRequests().pipe(
      map((requests) => requests.filter((request) => request.status === 'MANAGER_APPROVED')),
      switchMap((requests) => {
        if (requests.length === 0) {
          return of([]);
        }

        return forkJoin(
          requests.map((request) =>
            this.getFinanceRequestById(request.id).pipe(
              catchError(() => of(this.toFinanceRequestDetails(request)))
            )
          )
        );
      })
    );
  }

  private toFinanceRequestDetails(request: TravelRequest): FinanceRequestDetailsResponse {
    return {
      requestId: Number(request.id),
      employeeName: request.employeeName,
      department: request.department ?? '',
      destination: request.destination,
      travelClass: request.travelClass,
      startDate: request.startDate,
      endDate: request.endDate,
      estimatedCost: Number(request.estimatedCost),
      purpose: request.purpose,
      managerApproverName: '',
      managerComments: request.managerComment ?? '',
      status: request.status
    };
  }

  private toManagerRequestDetails(request: TravelRequest): ManagerRequestDetailsResponse {
    return {
      requestId: Number(request.id),
      employeeName: request.employeeName,
      department: request.department,
      destination: request.destination,
      travelClass: request.travelClass,
      startDate: request.startDate,
      endDate: request.endDate,
      estimatedCost: Number(request.estimatedCost),
      purpose: request.purpose,
      status: request.status
    };
  }

  private get employeeId(): number {
    return this.authService.currentUserId();
  }

  private get managerId(): number {
    return this.authService.currentUserId();
  }

  private get financeId(): number {
    return this.authService.currentUserId();
  }

  private getFinanceApprovalValidationError(
    request: FinanceRequestDetailsResponse,
    comment: string
  ): string {
    if (!this.financeId) {
      return 'Logged-in finance user id is required.';
    }

    if (!request.requestId) {
      return 'Travel request id is required.';
    }

    if (comment.length > this.maxApprovalCommentLength) {
      return `Comments must be ${this.maxApprovalCommentLength} characters or fewer.`;
    }

    return '';
  }

  private buildFinanceApprovalPayload(comment: string): { financeId: number; comments: string } {
    return {
      financeId: this.financeId as number,
      comments: comment
    };
  }

  private normalizeApprovalRequestId(requestId: number | string): number {
    const id = Number(requestId);
    return Number.isFinite(id) && id > 0 ? id : 0;
  }

  private buildDraftPayload(request: TravelRequest) {
    return {
      employeeId: this.employeeId,
      destination: request.destination?.trim(),
      travelClass: request.travelClass,
      startDate: request.startDate,
      endDate: request.endDate,
      estimatedCost: Number(request.estimatedCost),
      purpose: request.purpose?.trim(),
      status: 'DRAFT'
    };
  }

  private buildPayload(request: TravelRequest) {
    return {
      employeeId: this.employeeId,
      destination: request.destination?.trim(),
      travelClass: request.travelClass,
      startDate: request.startDate,
      endDate: request.endDate,
      estimatedCost: Number(request.estimatedCost),
      purpose: request.purpose?.trim()
    };
  }
}
