export type ExpenseCategory = 'FOOD' | 'HOTEL' | 'STAY' | 'TRANSPORT' | 'FLIGHT' | 'TRAIN' | 'CAR_RENTAL' | 'OTHER';
export type ReimbursementStatus = 'PENDING' | 'APPROVED' | 'REIMBURSED' | 'REJECTED';

export interface Expense {
  id: string;
  travelRequestId: string;
  employeeId: number;
  employeeEmail: string;
  employeeName: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate?: string;
  segmentType?: string;
  fromLocation?: string;
  toLocation?: string;
  startTime?: string;
  endTime?: string;
  description: string;
  proofFileName: string;
  reimbursementStatus: ReimbursementStatus;
  financeComment?: string;
  createdAt: string;
  updatedAt: string;
}
