import { Injectable, inject } from '@angular/core';
import { ApprovalHistoryItem, ApprovalLevel, TravelRequest } from '../models/travel-request.model';
import { AuthService } from './auth.service';
import { AuditLogService } from './audit-log.service';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private readonly authService = inject(AuthService);
  private readonly auditLogService = inject(AuditLogService);

  addHistory(
    request: TravelRequest,
    level: ApprovalLevel,
    action: ApprovalHistoryItem['action'],
    comment: string
  ): TravelRequest {
    const actor = this.authService.currentUser()?.name ?? 'System';
    const timestamp = new Date().toISOString();

    return {
      ...request,
      approvalHistory: [
        ...(request.approvalHistory ?? []),
        { level, action, actor, comment, timestamp }
      ],
      updatedAt: timestamp
    };
  }

  submit(request: TravelRequest): TravelRequest {
    this.assertStatus(request, ['DRAFT'], 'submit');
    return {
      ...this.addHistory(request, 'EMPLOYEE', 'SUBMITTED', 'Submitted for manager approval'),
      status: 'SUBMITTED'
    };
  }

  approveByManager(request: TravelRequest, comment: string): TravelRequest {
    this.assertStatus(request, ['SUBMITTED'], 'manager approval');
    return {
      ...this.addHistory(request, 'MANAGER', 'APPROVED', comment),
      status: 'MANAGER_APPROVED',
      managerComment: comment
    };
  }

  rejectByManager(request: TravelRequest, comment: string): TravelRequest {
    this.assertStatus(request, ['SUBMITTED'], 'manager rejection');
    return {
      ...this.addHistory(request, 'MANAGER', 'REJECTED', comment),
      status: 'MANAGER_REJECTED',
      managerComment: comment
    };
  }

  approveByFinance(request: TravelRequest, comment: string): TravelRequest {
    this.assertStatus(request, ['MANAGER_APPROVED'], 'finance approval');
    return {
      ...this.addHistory(request, 'FINANCE', 'APPROVED', comment),
      status: 'FINANCE_APPROVED',
      financeComment: comment
    };
  }

  rejectByFinance(request: TravelRequest, comment: string): TravelRequest {
    this.assertStatus(request, ['MANAGER_APPROVED'], 'finance rejection');
    return {
      ...this.addHistory(request, 'FINANCE', 'REJECTED', comment),
      status: 'FINANCE_REJECTED',
      financeComment: comment
    };
  }

  record(actionType: 'CREATE' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'UPDATE' | 'POLICY', description: string): void {
    const actor = this.authService.currentUser()?.name ?? 'System';
    this.auditLogService.record(actor, actionType, description);
  }

  private assertStatus(request: TravelRequest, expected: TravelRequest['status'][], action: string): void {
    if (!expected.includes(request.status)) {
      throw new Error(`Cannot ${action} request ${request.id} while status is ${request.status}.`);
    }
  }
}
