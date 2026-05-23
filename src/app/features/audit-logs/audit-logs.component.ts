import { Component, inject } from '@angular/core';
import { AuditLogService } from '@core/services/audit-log.service';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [StatusBadgeComponent],
  templateUrl: './audit-logs.component.html'
})
export class AuditLogsComponent {
  private readonly auditLogService = inject(AuditLogService);
  readonly logs = this.auditLogService.getLogs();
}
