export interface Policy {
  id: string;
  title: string;
  category: 'Budget' | 'Travel Class' | 'Expense';
  department: string;
  maxBudget: number;
  allowedClasses: Array<'Economy' | 'Premium Economy' | 'Business'>;
  limit: string;
  status: 'Active' | 'Draft';
}
