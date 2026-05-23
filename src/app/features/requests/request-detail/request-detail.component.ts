import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TravelRequest } from '@core/models/travel-request.model';
import { PolicyService } from '@core/services/policy.service';
import { TravelRequestService } from '@core/services/travel-request.service';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './request-detail.component.html'
})
export class RequestDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly policyService = inject(PolicyService);
  private readonly requestService = inject(TravelRequestService);

  request: TravelRequest | null = null;
  loading = true;
  message = '';
  editMode = false;
  editForm = this.fb.nonNullable.group({
    destination: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    purpose: ['', [Validators.required, Validators.minLength(8)]],
    estimatedCost: [0, [Validators.required, Validators.min(1)]],
    travelClass: ['Economy' as TravelRequest['travelClass'], Validators.required]
  }, { validators: this.dateRangeValidator });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.requestService.getRequestById(id).subscribe({
      next: (request) => {
        this.request = request;
        this.fillEditForm(request);
        this.loading = false;
      },
      error: () => {
        this.message = 'Unable to load travel request.';
        this.loading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    if (status === 'FINANCE_APPROVED' || status === 'COMPLETED' || status === 'REIMBURSED') return 'status-approved';
    if (status === 'MANAGER_REJECTED' || status === 'FINANCE_REJECTED') return 'status-rejected';
    if (status === 'DRAFT') return 'status-draft';
    return 'status-pending';
  }

  get policyViolations() {
    if (!this.request) {
      return [];
    }

    return this.policyService.evaluateRequest({ ...this.request, ...this.editForm.getRawValue() });
  }

  saveDraftChanges(): void {
    if (!this.request || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const updatedRequest: TravelRequest = {
      ...this.request,
      ...this.editForm.getRawValue(),
      estimatedCost: Number(this.editForm.controls.estimatedCost.value)
    };

    this.requestService.updateDraft(updatedRequest).subscribe({
      next: (request) => {
        this.request = request;
        this.editMode = false;
        this.message = 'Draft updated.';
      },
      error: () => this.message = 'Could not update draft.'
    });
  }

  submitDraft(): void {
    if (!this.request) return;

    this.requestService.submitDraft(this.request.id).subscribe({
      next: (request) => {
        this.request = request;
        this.editMode = false;
        this.message = 'Draft submitted for manager approval.';
      },
      error: () => this.message = 'Could not submit draft.'
    });
  }

  deleteDraft(): void {
    if (!this.request || !confirm('Delete this draft request?')) return;

    this.requestService.deleteDraft(this.request.id).subscribe({
      next: () => void this.router.navigateByUrl('/travel-requests'),
      error: () => this.message = 'Could not delete draft.'
    });
  }

  private fillEditForm(request: TravelRequest): void {
    this.editForm.reset({
      destination: request.destination,
      startDate: request.startDate,
      endDate: request.endDate,
      purpose: request.purpose,
      estimatedCost: request.estimatedCost,
      travelClass: request.travelClass
    });
  }

  private dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const startDate = control.get('startDate')?.value;
    const endDate = control.get('endDate')?.value;

    if (!startDate || !endDate) {
      return null;
    }

    return new Date(endDate) < new Date(startDate) ? { dateRange: true } : null;
  }
}
