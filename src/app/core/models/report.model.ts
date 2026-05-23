export interface ReportSummary {
  label: string;
  value: string;
  trend: string;
}

export interface DepartmentSpend {
  department: string;
  trips: number;
  spend: number;
}

export interface MonthlyCost {
  month: string;
  requests: number;
  cost: number;
}
