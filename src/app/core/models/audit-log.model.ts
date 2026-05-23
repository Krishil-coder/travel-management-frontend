export interface AuditLog {
  id: string;
  actor: string;
  actionType: 'CREATE' | 'UPDATE' | 'APPROVE' | 'REJECT' | 'LOGIN' | 'SUBMIT' | 'REIMBURSE' | 'POLICY';
  description: string;
  timestamp: string;
}
