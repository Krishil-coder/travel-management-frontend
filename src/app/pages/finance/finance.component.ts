import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TravelRequest } from '@core/models/travel-request.model';
import { TravelRequestService } from '@core/services/travel-request.service';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss']
})
export class FinanceComponent {
  private readonly requestService = inject(TravelRequestService);
  pendingRequests: TravelRequest[] = [];

  constructor() {
    this.requestService.getFinanceApprovals().subscribe({
      next: (requests) => this.pendingRequests = requests,
      error: () => this.pendingRequests = []
    });
  }
}
