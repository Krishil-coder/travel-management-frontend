import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TravelRequest } from '@core/models/travel-request.model';
import { TravelRequestService } from '@core/services/travel-request.service';

@Component({
  selector: 'app-manager',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.scss']
})
export class ManagerComponent {
  private readonly requestService = inject(TravelRequestService);
  pendingRequests: TravelRequest[] = [];

  constructor() {
    this.requestService.getManagerApprovals().subscribe({
      next: (requests) => this.pendingRequests = requests,
      error: () => this.pendingRequests = []
    });
  }
}
