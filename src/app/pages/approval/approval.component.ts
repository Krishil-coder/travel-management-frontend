import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ApprovalService } from '@core/services/approval.service';
import {
  FinanceRequestDetailsResponse,
  ManagerRequestDetailsResponse
} from '@core/services/travel-request.service';

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
  readonly maxCommentLength = 1000;
  message = '';
  loading = false;
  commentForms: Record<string, FormGroup<{ comment: FormControl<string> }>> = {};
  managerRequests: ManagerRequestDetailsResponse[] = [];
  financeRequests: FinanceRequestDetailsResponse[] = [];

  constructor() {
    this.refreshRequests();
  }

  get canViewManagerApprovals(): boolean {
    return true;
  }

  get canViewFinanceApprovals(): boolean {
    return true;
  }

  approveManager(request: ManagerRequestDetailsResponse): void {
    if (!this.canViewManagerApprovals) {
      return;
    }

    if (!this.hasValidComment(request.requestId)) return;
    this.approvalService.approveByManager(request, this.getComment(request.requestId)).subscribe({
      next: () => this.afterAction(request.requestId + ' sent to finance.', request.requestId),
      error: () => this.message = 'Could not approve request.'
    });
  }

  approveFinance(request: FinanceRequestDetailsResponse): void {
    if (!this.canViewFinanceApprovals) {
      return;
    }

    if (!this.hasValidComment(request.requestId)) return;
    this.approvalService.approveByFinance(request, this.getComment(request.requestId)).subscribe({
      next: () => this.afterAction(request.requestId + ' approved and finalized.', request.requestId),
      error: (error) => this.message = error?.message || 'Could not approve request.'
    });
  }

  rejectByManager(request: ManagerRequestDetailsResponse): void {
    if (!this.canViewManagerApprovals) {
      return;
    }

    if (!confirm('Reject this request?')) return;
    if (!this.hasValidComment(request.requestId)) return;
    this.approvalService.rejectByManager(request, this.getComment(request.requestId)).subscribe({
      next: () => this.afterAction(request.requestId + ' rejected.', request.requestId),
      error: () => this.message = 'Could not reject request.'
    });
  }

  rejectByFinance(request: FinanceRequestDetailsResponse): void {
    if (!this.canViewFinanceApprovals) {
      return;
    }

    if (!confirm('Reject this request?')) return;
    if (!this.hasValidComment(request.requestId)) return;
    this.approvalService.rejectByFinance(request, this.getComment(request.requestId)).subscribe({
      next: () => this.afterAction(request.requestId + ' rejected.', request.requestId),
      error: (error) => this.message = error?.message || 'Could not reject request.'
    });
  }

  private refreshRequests(): void {
    this.loading = true;

    if (this.canViewManagerApprovals) {
      this.approvalService.getManagerApprovals().subscribe({
        next: (requests) => {
          this.managerRequests = requests;
          this.prepareCommentForms(requests, true);
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
          this.prepareCommentForms(requests, false);
          this.loading = false;
        },
        error: () => {
          this.message = 'Unable to load finance approvals.';
          this.loading = false;
        }
      });
    }
  }

  private afterAction(message: string, id: number): void {
    this.message = message;
    this.clearComment(id);
    this.refreshRequests();
  }

  private getComment(id: number): string {
    return this.commentForms[id]?.controls.comment.value.trim() ?? '';
  }

  private clearComment(id: number): void {
    this.commentForms[id]?.reset({ comment: '' });
  }

  private hasValidComment(id: number): boolean {
    const form = this.commentForms[id];

    if (!form || form.invalid) {
      form?.markAllAsTouched();
      this.message = 'Please check the approval comment.';
      return false;
    }

    return true;
  }

  private prepareCommentForms(
    requests: Array<ManagerRequestDetailsResponse | FinanceRequestDetailsResponse>,
    required: boolean
  ): void {
    for (const request of requests) {
      if (!this.commentForms[request.requestId]) {
        this.commentForms[request.requestId] = this.fb.nonNullable.group({
          comment: ['', required ? [Validators.required, Validators.maxLength(this.maxCommentLength)] : Validators.maxLength(this.maxCommentLength)]
        });
      }
    }
  }
}
