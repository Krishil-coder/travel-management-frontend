export type ExpenseCategory = 'FOOD' | 'STAY' | 'TRANSPORT' | 'OTHER';
export type ReimbursementStatus = 'PENDING' | 'REIMBURSED' | 'REJECTED';

export interface Expense {
  id: string;
  travelRequestId: string;
  employeeId: number;
  employeeEmail: string;
  employeeName: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  proofFileName: string;
  reimbursementStatus: ReimbursementStatus;
  financeComment?: string;
  createdAt: string;
  updatedAt: string;
}
