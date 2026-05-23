import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { TravelRequest } from '@core/models/travel-request.model';
import { AuthService } from '@core/services/auth.service';
import { PolicyService } from '@core/services/policy.service';
import { TravelRequestService } from '@core/services/travel-request.service';

@Component({
  selector: 'app-create-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-request.component.html'
})
export class CreateRequestComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly policyService = inject(PolicyService);
  private readonly travelRequestService = inject(TravelRequestService);
  message = '';
  loading = false;
  requestForm = this.fb.nonNullable.group({
    destination: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    purpose: ['', [Validators.required, Validators.minLength(8)]],
    estimatedCost: [0, [Validators.required, Validators.min(1)]],
    travelClass: ['Economy', Validators.required]
  }, { validators: this.dateRangeValidator });

  get policyViolations() {
    return this.policyService.evaluateRequest(this.toRequest());
  }

  saveDraft(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.travelRequestService.saveDraft(this.toRequest()).subscribe({
      next: () => {
        this.message = 'Draft saved.';
        this.loading = false;
        this.resetForm();
      },
      error: () => {
        this.message = 'Could not save draft.';
        this.loading = false;
      }
    });
  }

  submit(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.travelRequestService.submitRequest(this.toRequest()).subscribe({
      next: () => {
        this.message = 'Travel request submitted for manager approval.';
        this.loading = false;
        this.resetForm();
      },
      error: () => {
        this.message = 'Could not submit travel request.';
        this.loading = false;
      }
    });
  }

  private toRequest(): TravelRequest {
    const user = this.authService.currentUser();
    const value = this.requestForm.getRawValue();
    const now = new Date().toISOString();

    return {
      id: '',
      employeeId: user?.id ?? 0,
      employeeEmail: user?.email ?? '',
      employeeName: user?.name ?? '',
      department: user?.department ?? '',
      destination: value.destination,
      startDate: value.startDate,
      endDate: value.endDate,
      purpose: value.purpose,
      estimatedCost: Number(value.estimatedCost),
      travelClass: value.travelClass as TravelRequest['travelClass'],
      status: 'DRAFT',
      policyViolations: [],
      approvalHistory: [],
      managerComment: '',
      financeComment: '',
      createdAt: now,
      updatedAt: now
    };
  }

  private resetForm(): void {
    this.requestForm.reset({ destination: '', startDate: '', endDate: '', purpose: '', estimatedCost: 0, travelClass: 'Economy' });
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
