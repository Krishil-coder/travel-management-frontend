import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  getStats() {
    return [
      { label: 'Open Requests', value: '12', hint: '4 awaiting approval' },
      { label: 'Approved Trips', value: '28', hint: 'This quarter' },
      { label: 'Pending Expenses', value: '7', hint: 'Proof required' },
      { label: 'Reimbursements', value: '₹1.8L', hint: 'In processing' }
    ];
  }

  getRecentActivity() {
    return [
      'TRV-1024 submitted for Singapore client visit',
      'Manager approved TRV-1019 for Pune workshop',
      'Finance requested hotel invoice for EXP-778',
      'Policy update drafted for international meals'
    ];
  }
}
