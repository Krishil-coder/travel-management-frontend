import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TravelRequest } from '@core/models/travel-request.model';
import { AuthService } from '@core/services/auth.service';
import { TravelRequestService } from '@core/services/travel-request.service';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-requests.component.html'
})
export class MyRequestsComponent {
  private readonly authService = inject(AuthService);
  private readonly requestService = inject(TravelRequestService);
  requests: TravelRequest[] = [];
  loading = true;
  message = '';

  constructor() {
    this.loadRequests();
  }

  getStatusClass(status: string): string {
    if (status === 'FINANCE_APPROVED' || status === 'COMPLETED' || status === 'REIMBURSED') return 'status-approved';
    if (status === 'MANAGER_REJECTED' || status === 'FINANCE_REJECTED') return 'status-rejected';
    if (status === 'DRAFT') return 'status-draft';
    return 'status-pending';
  }

  submitDraft(request: TravelRequest): void {
    this.requestService.submitDraft(request.id).subscribe({
      next: () => {
        this.message = 'Draft submitted.';
        this.loadRequests();
      },
      error: () => this.message = 'Could not submit draft.'
    });
  }

  deleteDraft(request: TravelRequest): void {
    if (!confirm('Delete this draft request?')) return;

    this.requestService.deleteDraft(request.id).subscribe({
      next: () => {
        this.message = 'Draft deleted.';
        this.loadRequests();
      },
      error: () => this.message = 'Could not delete draft.'
    });
  }

  private loadRequests(): void {
    const role = this.authService.getRole();
    const requestCall = role === 'EMPLOYEE' ? this.requestService.getMyRequests() : this.requestService.getRequests();

    requestCall.subscribe({
      next: (requests) => {
        this.requests = requests;
        this.loading = false;
      },
      error: () => {
        this.message = 'Unable to load travel requests.';
        this.loading = false;
      }
    });
  }
}
