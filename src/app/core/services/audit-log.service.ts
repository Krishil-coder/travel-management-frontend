import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuditLog } from '../models/audit-log.model';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly http = inject(HttpClient);
  private readonly logs: AuditLog[] = [];

  constructor() {
    this.loadLogs();
  }

  getLogs(): AuditLog[] {
    return this.logs;
  }

  record(actor: string, actionType: AuditLog['actionType'], description: string): void {
    this.http.post<AuditLog>(`${environment.apiUrl}/audit-logs`, { actor, actionType, description }).subscribe({
      next: (log) => this.logs.unshift(log)
    });
  }

  private loadLogs(): void {
    this.http.get<AuditLog[]>(`${environment.apiUrl}/audit-logs`).subscribe({
      next: (logs) => {
        this.logs.splice(0, this.logs.length, ...logs);
      }
    });
  }
}
