import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { RequestStatus, TravelRequest } from '@core/models/travel-request.model';
import { AuthService } from '@core/services/auth.service';
import { PolicyService } from '@core/services/policy.service';
import { TravelRequestService } from '@core/services/travel-request.service';

@Component({
  selector: 'app-submit-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './submit-request.component.html',
  styleUrls: ['./submit-request.component.scss']
})
export class SubmitRequestComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly policyService = inject(PolicyService);
  private readonly requestService = inject(TravelRequestService);

  readonly travelClasses = ['Economy', 'Premium Economy', 'Business'];

  loading = false;
  saving = false;
  message = '';
  selectedDraftId = '';
  requests: TravelRequest[] = [];
  request: TravelRequest = this.getEmptyRequest();

  ngOnInit(): void {
    this.loadDrafts();
  }

  get drafts(): TravelRequest[] {
    return this.requests.filter((item) => item.status === 'DRAFT');
  }

  get policyViolations() {
    return this.policyService.evaluateRequest(this.request);
  }

  selectDraft(item: TravelRequest): void {
    if (item.status !== 'DRAFT') {
      return;
    }

    this.request = this.normalizeDraft(item);
    this.selectedDraftId = this.request.id;
  }

  saveChanges(): void {
    if (!this.canUseForm()) {
      this.message = 'Fill required fields before saving.';
      return;
    }

    const payload = this.prepareRequest('DRAFT');

    if (!payload.id) {
      this.message = 'Select a draft request first.';
      return;
    }

    this.saving = true;

    this.requestService.updateDraft(payload).subscribe({
      next: () => {
        this.saving = false;
        this.message = 'Draft updated.';
        this.loadDrafts(payload.id);
      },
      error: () => {
        this.saving = false;
        this.message = 'Could not update draft.';
      }
    });
  }

  sendRequest(): void {
    if (!this.canUseForm()) {
      this.message = 'Fill required fields before sending.';
      return;
    }

    const payload = this.prepareRequest('DRAFT');

    if (!payload.id) {
      this.message = 'Select a draft request first.';
      return;
    }

    this.saving = true;

    this.requestService.updateDraft(payload).subscribe({
      next: () => {
        this.submitDraft(payload.id);
      },
      error: () => {
        this.saving = false;
        this.message = 'Could not save edits before sending.';
      }
    });
  }

  deleteDraft(item: TravelRequest): void {
    if (!item.id) {
      return;
    }

    this.saving = true;

    this.requestService.deleteDraft(item).subscribe({
      next: () => {
        this.saving = false;
        this.message = 'Draft deleted.';
        this.loadDrafts();
      },
      error: () => {
        this.saving = false;
        this.message = 'Could not delete draft.';
      }
    });
  }

  getStatusText(status: RequestStatus): string {
    return status.replaceAll('_', ' ');
  }

  private submitDraft(id: string): void {
    this.requestService.submitDraft(id).subscribe({
      next: () => {
        this.saving = false;
        this.message = 'Draft sent for approval.';
        this.selectedDraftId = '';
        this.request = this.getEmptyRequest();
        this.loadDrafts();
      },
      error: () => {
        this.saving = false;
        this.message = 'Could not send request.';
      }
    });
  }

  private loadDrafts(preferredId = ''): void {
    this.loading = true;

    this.requestService.getMyRequests().subscribe({
      next: (response: any) => {
        const requests = response?.data || response || [];

        this.requests = requests.map((item: TravelRequest) =>
          this.normalizeDraft(item)
        );
        this.loading = false;

        const selected =
          this.drafts.find((item) => item.id === preferredId) ||
          this.drafts.find((item) => item.id === this.selectedDraftId) ||
          this.drafts[0];

        if (selected) {
          this.selectDraft(selected);
        } else {
          this.selectedDraftId = '';
          this.request = this.getEmptyRequest();
        }
      },
      error: () => {
        this.loading = false;
        this.message = 'Unable to load draft requests.';
      }
    });
  }

  private canUseForm(): boolean {
    return !!(
      this.request.destination?.trim() &&
      this.request.startDate &&
      this.request.endDate &&
      this.request.purpose?.trim() &&
      Number(this.request.estimatedCost) > 0
    );
  }

  private normalizeDraft(item: TravelRequest): TravelRequest {
    const user = this.authService.currentUser();

    return {
      ...item,
      id: this.getDraftId(item),
      employeeId: Number(item.employeeId || this.authService.currentUserId()),
      employeeEmail: item.employeeEmail || user?.email || '',
      employeeName: item.employeeName || user?.name || '',
      department: item.department || user?.department || '',
      estimatedCost: Number(item.estimatedCost || 0)
    };
  }

  private getDraftId(item: TravelRequest): string {
    const draft = item as TravelRequest & {
      requestId?: string;
      _id?: string;
    };

    return String(draft.id || draft.requestId || draft._id || '');
  }

  private prepareRequest(status: RequestStatus): TravelRequest {
    return {
      ...this.request,
      estimatedCost: Number(this.request.estimatedCost),
      status,
      updatedAt: new Date().toISOString(),
      policyViolations: this.policyViolations
    };
  }

  private getEmptyRequest(): TravelRequest {
    const user = this.authService.currentUser();
    const now = new Date().toISOString();

    return {
      id: '',
      employeeId: this.authService.currentUserId(),
      employeeEmail: user?.email || '',
      employeeName: user?.name || '',
      department: user?.department || '',
      destination: '',
      startDate: '',
      endDate: '',
      purpose: '',
      estimatedCost: 0,
      travelClass: 'Economy',
      status: 'DRAFT',
      policyViolations: [],
      approvalHistory: [],
      managerComment: '',
      financeComment: '',
      createdAt: now,
      updatedAt: now
    };
  }
}
