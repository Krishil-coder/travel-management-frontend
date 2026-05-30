import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  FinanceRequestDetailsResponse,
  ManagerRequestDetailsResponse,
  TravelRequestService
} from './travel-request.service';

@Injectable({ providedIn: 'root' })
export class ApprovalService {
  private readonly requestService = inject(TravelRequestService);

  getManagerApprovals(): Observable<ManagerRequestDetailsResponse[]> {
    return this.requestService.getManagerApprovals();
  }

  getManagerRequestById(id: string): Observable<ManagerRequestDetailsResponse> {
    return this.requestService.getManagerRequestById(id);
  }

  getFinanceApprovals(): Observable<FinanceRequestDetailsResponse[]> {
    return this.requestService.getFinanceApprovals();
  }

  approveByManager(
    request: ManagerRequestDetailsResponse,
    comment: string
  ): Observable<ManagerRequestDetailsResponse> {
    return this.requestService.approveByManager(request, comment);
  }

  rejectByManager(
    request: ManagerRequestDetailsResponse,
    comment: string
  ): Observable<ManagerRequestDetailsResponse> {
    return this.requestService.rejectByManager(request, comment);
  }

  approveByFinance(
    request: FinanceRequestDetailsResponse,
    comment: string
  ): Observable<FinanceRequestDetailsResponse> {
    return this.requestService.approveByFinance(request, comment);
  }

  rejectByFinance(
    request: FinanceRequestDetailsResponse,
    comment: string
  ): Observable<FinanceRequestDetailsResponse> {
    return this.requestService.rejectByFinance(request, comment);
  }
}
