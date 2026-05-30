import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [roleGuard],
    children: [
      {
        path: 'requests/new',
        data: { roles: ['EMPLOYEE'] },
        loadComponent: () => import('./features/requests/create-request/create-request.component').then((m) => m.CreateRequestComponent)
      },
      {
        path: 'requests',
        data: { roles: ['EMPLOYEE'] },
        loadComponent: () => import('./features/requests/request-list/request-list.component').then((m) => m.RequestListComponent)
      },
      {
        path: 'requests/:id',
        data: { roles: ['EMPLOYEE'] },
        loadComponent: () => import('./features/requests/request-detail/request-detail.component').then((m) => m.RequestDetailComponent)
      },
      {
        path: 'manager/approvals',
        data: { roles: ['MANAGER'] },
        loadComponent: () => import('./features/approvals/manager-approvals/manager-approvals.component').then((m) => m.ManagerApprovalsComponent)
      },
      {
        path: 'finance/approvals',
        data: { roles: ['FINANCE'] },
        loadComponent: () => import('./features/approvals/finance-approvals/finance-approvals.component').then((m) => m.FinanceApprovalsComponent)
      },
      {
        path: 'expenses/:requestId',
        data: { roles: ['EMPLOYEE'] },
        loadComponent: () => import('./pages/expense/expense.component').then((m) => m.ExpenseComponent)
      },
      {
        path: 'admin',
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent)
      },
      { path: 'admin/users', pathMatch: 'full', redirectTo: 'admin' },
      {
        path: 'admin/policies',
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/admin/policies/policies.component').then((m) => m.PoliciesComponent)
      },
      {
        path: 'admin/reports',
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./pages/report/report.component').then((m) => m.ReportComponent)
      },
      { path: 'travel-request', pathMatch: 'full', redirectTo: 'requests/new' },
      {
        path: 'submit-request',
        data: { roles: ['EMPLOYEE'] },
        loadComponent: () => import('./pages/submit-request/submit-request.component').then((m) => m.SubmitRequestComponent)
      },
      { path: 'travel-requests', pathMatch: 'full', redirectTo: 'requests' },
      { path: 'travel-requests/create', pathMatch: 'full', redirectTo: 'requests/new' },
      { path: 'travel-requests/submit', pathMatch: 'full', redirectTo: 'submit-request' },
      {
        path: 'travel-requests/:id',
        loadComponent: () => import('./features/requests/request-detail/request-detail.component').then((m) => m.RequestDetailComponent)
      },
      { path: 'approval', pathMatch: 'full', redirectTo: 'manager/approvals' },
      { path: 'finance', pathMatch: 'full', redirectTo: 'finance/approvals' },
      { path: 'expenses', pathMatch: 'full', redirectTo: 'requests' },
      { path: 'report', pathMatch: 'full', redirectTo: 'admin/reports' },
      { path: 'reports', pathMatch: 'full', redirectTo: 'admin/reports' },
      {
        path: 'not-found',
        loadComponent: () => import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent)
      },
      { path: '**', redirectTo: 'not-found' }
    ]
  }
];
