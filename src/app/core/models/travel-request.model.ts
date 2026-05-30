export type RequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'MANAGER_APPROVED'
  | 'MANAGER_REJECTED'
  | 'FINANCE_APPROVED'
  | 'FINANCE_REJECTED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'REIMBURSED';
export type TravelClass = 'Economy' | 'Premium Economy' | 'Business';
export type ApprovalLevel = 'EMPLOYEE' | 'MANAGER' | 'FINANCE' | 'SYSTEM';

export interface ApprovalHistoryItem {
  level: ApprovalLevel;
  action: 'CREATED' | 'DRAFT_SAVED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'POLICY_FLAGGED';
  actor: string;
  comment: string;
  timestamp: string;
}

export interface PolicyViolation {
  policyId: string;
  title: string;
  severity: 'Warning' | 'Critical';
  message: string;
}

export interface TravelRequest {
  id: string;
  employeeId: number;
  employeeEmail: string;
  employeeName: string;
  department: string;
  destination: string;
  startDate: string;
  endDate: string;
  purpose: string;
  estimatedCost: number;
  travelClass: TravelClass;
  status: RequestStatus;
  policyViolations?: PolicyViolation[];
  approvalHistory?: ApprovalHistoryItem[];
  managerComment?: string;
  financeComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  travelRequestId: string;
  level: 'MANAGER' | 'FINANCE';
  action: 'APPROVED' | 'REJECTED';
  comment: string;
  actor: string;
  createdAt: string;
}
