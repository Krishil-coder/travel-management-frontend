export interface User {
  id: number;
  name: string;
  email: string;
  department: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'FINANCE' | 'ADMIN';
  manager?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}
