import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TravelRequest } from '@core/models/travel-request.model';
import { TravelRequestService } from '@core/services/travel-request.service';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-finance-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: './finance-approvals.component.html'
})
export class FinanceApprovalsComponent {
  private readonly travelRequestService = inject(TravelRequestService);
  message = '';
  comment = '';
  approvals: TravelRequest[] = [];

  constructor() {
    this.refresh();
  }

  approve(request: TravelRequest): void {
    this.travelRequestService.approveByFinance(request, this.comment.trim()).subscribe({
      next: () => this.afterAction(`${request.id} approved.`),
      error: () => this.message = 'Could not approve request.'
    });
  }

  reject(request: TravelRequest): void {
    this.travelRequestService.rejectByFinance(request, this.comment.trim()).subscribe({
      next: () => this.afterAction(`${request.id} rejected.`),
      error: () => this.message = 'Could not reject request.'
    });
  }

  private refresh(): void {
    this.travelRequestService.getFinanceApprovals().subscribe({
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
