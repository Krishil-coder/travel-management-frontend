import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  const isBackendApi = req.url.startsWith(environment.apiUrl) ||
    req.url.startsWith('http://localhost:8080/api');
  const isAuthRequest = req.url.includes('/auth/login') ||
    req.url.includes('/auth/register');

  // Login and register should not carry an old JWT.
  if (token && isBackendApi && !isAuthRequest) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
