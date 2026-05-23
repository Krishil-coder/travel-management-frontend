import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TravelRequest } from '@core/models/travel-request.model';
import { TravelRequestService } from '@core/services/travel-request.service';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: './request-list.component.html'
})
export class RequestListComponent {
  private readonly travelRequestService = inject(TravelRequestService);
  requests: TravelRequest[] = [];
  message = '';

  constructor() {
    this.travelRequestService.getRequests().subscribe({
      next: (requests) => this.requests = requests,
      error: () => this.message = 'Unable to load requests.'
    });
  }

  exportCsv(): void {
    this.message = `${this.requests.length} requests ready for CSV export.`;
  }

  viewRequest(id: string): void {
    this.message = `Viewing request ${id}. Details are shown in this row and the approval timeline.`;
  }
}
