import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  RequestStatus,
  TravelRequest
} from '@core/models/travel-request.model';

import { AuthService } from '@core/services/auth.service';
import { PolicyService } from '@core/services/policy.service';
import { TravelRequestService } from '@core/services/travel-request.service';

import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-travel-request',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    StatusBadgeComponent
  ],
  templateUrl: './travel-request.component.html',
  styleUrls: ['./travel-request.component.scss']
})
export class TravelRequestComponent implements OnInit {

  private readonly authService = inject(AuthService);
  private readonly policyService = inject(PolicyService);
  private readonly requestService = inject(TravelRequestService);

  travelClasses = [
    'Economy',
    'Premium Economy',
    'Business'
  ];

  message = '';
  loading = false;
  saving = false;
  editingDraftId = '';

  requests: TravelRequest[] = [];

  request: TravelRequest = this.getEmptyRequest();

  ngOnInit(): void {
    this.loadRequests();
  }

  get policyViolations() {
    return this.policyService.evaluateRequest(this.request);
  }

  get draftCount(): number {
    return this.draftRequests.length;
  }

  get draftRequests(): TravelRequest[] {
    return this.requests.filter(item => item.status === 'DRAFT');
  }

  get submittedRequests(): TravelRequest[] {
    return this.requests.filter(item => item.status !== 'DRAFT');
  }

  get submittedCount(): number {
    return this.requests.filter(item => item.status === 'SUBMITTED').length;
  }

  get approvedCount(): number {
    return this.requests.filter(
      item =>
        item.status === 'MANAGER_APPROVED' ||
        item.status === 'FINANCE_APPROVED'
    ).length;
  }

  get totalBudget(): number {
    return this.requests.reduce(
      (total, item) =>
        total + Number(item.estimatedCost || 0),
      0
    );
  }

  saveDraft(): void {

    if (!this.isFormReady()) {
      this.message = 'Fill required fields';
      return;
    }

    this.saving = true;

    const payload = this.prepareRequest('DRAFT');

    const requestCall = this.editingDraftId
      ? this.requestService.updateDraft(payload)
      : this.requestService.saveDraft(payload);

    requestCall.subscribe({
      next: () => {
        this.saving = false;
        this.message = 'Draft saved';
        this.resetForm();
        this.loadRequests();
      },
      error: () => {
        this.saving = false;
        this.message = 'Draft save failed';
      }
    });
  }

  submitRequest(): void {

    if (!this.isFormReady()) {
      this.message = 'Fill required fields';
      return;
    }

    this.saving = true;

    if (this.editingDraftId) {

      const payload = this.prepareRequest('DRAFT');

      this.requestService
        .updateDraft(payload)
        .subscribe({
          next: () => {
            this.requestService
              .submitDraft(this.editingDraftId)
              .subscribe({
                next: () => {
                  this.afterSubmitSuccess();
                },
                error: () => {
                  this.afterSubmitError();
                }
              });
          },
          error: () => {
            this.afterSubmitError();
          }
        });

      return;
    }

    const payload = this.prepareRequest('DRAFT');

    this.requestService
      .saveDraft(payload)
      .subscribe({
        next: (response: any) => {

          const savedRequest =
            response?.data || response;

          const id =
            savedRequest?.id;

          if (!id) {
            this.afterSubmitError();
            return;
          }

          this.requestService
            .submitDraft(String(id))
            .subscribe({
              next: () => {
                this.afterSubmitSuccess();
              },
              error: () => {
                this.afterSubmitError();
              }
            });
        },
        error: () => {
          this.afterSubmitError();
        }
      });
  }

  editDraft(item: TravelRequest): void {

    if (item.status !== 'DRAFT') {
      return;
    }

    this.editingDraftId = item.id || '';

    this.request = {
      ...item
    };
  }

  deleteDraft(item: TravelRequest): void {

    if (!item.id) {
      return;
    }

    this.requestService
      .deleteDraft(item)
      .subscribe({
        next: () => {
          this.loadRequests();
        },
        error: () => {
          this.message = 'Draft delete failed';
        }
      });
  }

  submitDraftFromList(item: TravelRequest): void {

    if (item.status !== 'DRAFT' || !item.id) {
      return;
    }

    this.saving = true;

    this.requestService
      .submitDraft(item.id)
      .subscribe({
        next: () => {
          this.saving = false;
          this.message = 'Draft submitted successfully';

          if (this.editingDraftId === item.id) {
            this.resetForm();
          }

          this.loadRequests();
        },
        error: () => {
          this.saving = false;
          this.message = 'Draft submit failed';
        }
      });
  }

  resetForm(): void {
    this.editingDraftId = '';
    this.request = this.getEmptyRequest();
  }

  getStatusText(status: RequestStatus): string {
    return status.replaceAll('_', ' ');
  }

  private loadRequests(): void {

    this.loading = true;

    this.requestService
      .getMyRequests()
      .subscribe({
        next: (response: any) => {

          this.requests =
            response?.data || response || [];

          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.message = 'Unable to load';
        }
      });
  }

  private isFormReady(): boolean {

    return !!(
      this.request.destination?.trim() &&
      this.request.startDate &&
      this.request.endDate &&
      this.request.purpose?.trim() &&
      Number(this.request.estimatedCost) > 0
    );
  }

  private prepareRequest(status: RequestStatus): TravelRequest {

    const now = new Date().toISOString();

    return {
      ...this.request,
      estimatedCost: Number(this.request.estimatedCost),
      status,
      updatedAt: now,
      policyViolations: this.policyViolations
    };
  }

  private afterSubmitSuccess(): void {
    this.saving = false;
    this.message = 'Submitted successfully';
    this.resetForm();
    this.loadRequests();
  }

  private afterSubmitError(): void {
    this.saving = false;
    this.message = 'Submit failed';
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
