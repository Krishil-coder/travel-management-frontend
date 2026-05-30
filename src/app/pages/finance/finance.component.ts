import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FinanceRequestDetailsResponse,
  TravelRequestService
} from '@core/services/travel-request.service';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss']
})
export class FinanceComponent {
  private readonly requestService = inject(TravelRequestService);
  pendingRequests: FinanceRequestDetailsResponse[] = [];

  constructor() {
    this.requestService.getFinanceApprovals().subscribe({
      next: (requests) => this.pendingRequests = requests,
      error: () => this.pendingRequests = []
    });
  }
}
