import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TravelRequest } from '@core/models/travel-request.model';
import { TravelRequestService } from '@core/services/travel-request.service';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  templateUrl: './request-list.component.html'
})
export class RequestListComponent {
  private readonly travelRequestService = inject(TravelRequestService);
  requests: TravelRequest[] = [];
  message = '';

  constructor() {
    this.travelRequestService.getMyRequests().subscribe({
      next: (requests) => this.requests = requests,
      error: () => this.message = 'Unable to load requests.'
    });
  }

  get draftRequests(): TravelRequest[] {
    return this.requests.filter((request) => request.status === 'DRAFT');
  }

  get submittedRequests(): TravelRequest[] {
    return this.requests.filter((request) => request.status !== 'DRAFT');
  }
}
