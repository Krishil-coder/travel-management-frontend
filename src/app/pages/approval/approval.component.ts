import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TravelRequest } from '@core/models/travel-request.model';
import { AuthService } from '@core/services/auth.service';
import { ApprovalService } from '@core/services/approval.service';

@Component({
  selector: 'app-approval',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './approval.component.html',
  styleUrls: ['./approval.component.scss']
})
export class ApprovalComponent {
  private readonly authService = inject(AuthService);
  private readonly approvalService = inject(ApprovalService);
  private readonly fb = inject(FormBuilder);
  selectedView: 'manager' | 'finance' = this.authService.getRole() === 'FINANCE' ? 'finance' : 'manager';
  message = '';
  loading = false;
  commentForms: Record<string, FormGroup<{ comment: FormControl<string> }>> = {};
  managerRequests: TravelRequest[] = [];
  financeRequests: TravelRequest[] = [];

  constructor() {
    this.refreshRequests();
  }

  get canViewManagerApprovals(): boolean {
    return true;
  }

  get canViewFinanceApprovals(): boolean {
    return true;
  }

  approveManager(request: TravelRequest): void {
    if (!this.canViewManagerApprovals) {
      return;
    }

    if (!this.hasValidComment(request.id)) return;
    this.approvalService.approveByManager(request, this.getComment(request.id)).subscribe({
      next: () => this.afterAction(request.id + ' sent to finance.', request.id),
      error: () => this.message = 'Could not approve request.'
    });
  }

  approveFinance(request: TravelRequest): void {
    if (!this.canViewFinanceApprovals) {
      return;
    }

    if (!this.hasValidComment(request.id)) return;
    this.approvalService.approveByFinance(request, this.getComment(request.id)).subscribe({
      next: () => this.afterAction(request.id + ' approved and finalized.', request.id),
      error: () => this.message = 'Could not approve request.'
    });
  }

  rejectByManager(request: TravelRequest): void {
    if (!this.canViewManagerApprovals) {
      return;
    }

    if (!confirm('Reject this request?')) return;
    if (!this.hasValidComment(request.id)) return;
    this.approvalService.rejectByManager(request, this.getComment(request.id)).subscribe({
      next: () => this.afterAction(request.id + ' rejected.', request.id),
      error: () => this.message = 'Could not reject request.'
    });
  }

  rejectByFinance(request: TravelRequest): void {
    if (!this.canViewFinanceApprovals) {
      return;
    }

    if (!confirm('Reject this request?')) return;
    if (!this.hasValidComment(request.id)) return;
    this.approvalService.rejectByFinance(request, this.getComment(request.id)).subscribe({
      next: () => this.afterAction(request.id + ' rejected.', request.id),
      error: () => this.message = 'Could not reject request.'
    });
  }

  private refreshRequests(): void {
    this.loading = true;

    if (this.canViewManagerApprovals) {
      this.approvalService.getManagerApprovals().subscribe({
        next: (requests) => {
          this.managerRequests = requests;
          this.prepareCommentForms(requests);
          this.loading = false;
        },
        error: () => {
          this.message = 'Unable to load manager approvals.';
          this.loading = false;
        }
      });
    }

    if (this.canViewFinanceApprovals) {
      this.approvalService.getFinanceApprovals().subscribe({
        next: (requests) => {
          this.financeRequests = requests;
          this.prepareCommentForms(requests);
          this.loading = false;
        },
        error: () => {
          this.message = 'Unable to load finance approvals.';
          this.loading = false;
        }
      });
    }
  }

  private afterAction(message: string, id: string): void {
    this.message = message;
    this.clearComment(id);
    this.refreshRequests();
  }

  private getComment(id: string): string {
    return this.commentForms[id]?.controls.comment.value.trim() ?? '';
  }

  private clearComment(id: string): void {
    this.commentForms[id]?.reset({ comment: '' });
  }

  private hasValidComment(id: string): boolean {
    const form = this.commentForms[id];

    if (!form || form.invalid) {
      form?.markAllAsTouched();
      this.message = 'Please add an approval comment.';
      return false;
    }

    return true;
  }

  private prepareCommentForms(requests: TravelRequest[]): void {
    for (const request of requests) {
      if (!this.commentForms[request.id]) {
        this.commentForms[request.id] = this.fb.nonNullable.group({
          comment: ['', Validators.required]
        });
      }
    }
  }
}
