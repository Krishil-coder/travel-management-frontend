import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TravelRequest } from '../models/travel-request.model';
import { TravelRequestService } from './travel-request.service';

@Injectable({ providedIn: 'root' })
export class ApprovalService {
  private readonly requestService = inject(TravelRequestService);

  getManagerApprovals(): Observable<TravelRequest[]> {
    return this.requestService.getManagerApprovals();
  }

  getFinanceApprovals(): Observable<TravelRequest[]> {
    return this.requestService.getFinanceApprovals();
  }

  approveByManager(request: TravelRequest, comment: string): Observable<TravelRequest> {
    return this.requestService.approveByManager(request, comment);
  }

  rejectByManager(request: TravelRequest, comment: string): Observable<TravelRequest> {
    return this.requestService.rejectByManager(request, comment);
  }

  approveByFinance(request: TravelRequest, comment: string): Observable<TravelRequest> {
    return this.requestService.approveByFinance(request, comment);
  }

  rejectByFinance(request: TravelRequest, comment: string): Observable<TravelRequest> {
    return this.requestService.rejectByFinance(request, comment);
  }
}
