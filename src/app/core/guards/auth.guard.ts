import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

export const authGuard: CanActivateFn = (route) => checkAccess(route);

export const roleGuard: CanActivateChildFn = (route) => checkAccess(route);

function checkAccess(route: ActivatedRouteSnapshot) {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const allowedRoles = route.data?.['roles'] as UserRole[] | undefined;
  const currentRole = authService.currentRole();

  if (allowedRoles?.length && (!currentRole || !allowedRoles.includes(currentRole))) {
    return router.createUrlTree([authService.getDashboardRoute(currentRole ?? 'EMPLOYEE')]);
  }

  return true;
}
