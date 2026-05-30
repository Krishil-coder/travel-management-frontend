import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

import {
  TravelRequestService,
  ManagerRequestDetailsResponse
} from '@core/services/travel-request.service';

@Component({
  selector: 'app-manager-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: './manager-approvals.component.html'
})
export class ManagerApprovalsComponent {
  private readonly travelRequestService = inject(TravelRequestService);

  message = '';
  comment = '';
  approvals: ManagerRequestDetailsResponse[] = [];

  constructor() {
    this.refresh();
  }

  approve(request: ManagerRequestDetailsResponse): void {
    this.travelRequestService.approveByManager(request, this.comment.trim()).subscribe({
      next: () => this.afterAction(`${request.requestId} sent to finance.`),
      error: () => this.message = 'Could not approve request.'
    });
  }

  reject(request: ManagerRequestDetailsResponse): void {
    this.travelRequestService.rejectByManager(request, this.comment.trim()).subscribe({
      next: () => this.afterAction(`${request.requestId} rejected.`),
      error: () => this.message = 'Could not reject request.'
    });
  }

  private refresh(): void {
    this.travelRequestService.getManagerApprovals().subscribe({
      next: (approvals) => this.approvals = approvals,
      error: () => this.approvals = []
    });
  }

  private afterAction(message: string): void {
    this.message = message;
    this.comment = '';
    this.refresh();
  }
}