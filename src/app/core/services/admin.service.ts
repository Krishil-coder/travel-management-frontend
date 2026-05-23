import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Policy } from '../models/policy.model';

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'FINANCE' | 'ADMIN';
  department: string;
  managerId: number | null;
  managerName?: string;
  enabled: boolean;
  createdAt?: string;
}

export interface SaveAdminUser {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: AdminUser['role'];
  department: string;
  managerId: number | null;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private readonly http = inject(HttpClient);

  private policies: Policy[] = [
    {
      id: 'POL-1001',
      title: 'Default Travel Budget',
      category: 'Budget',
      department: 'All',
      maxBudget: 100000,
      allowedClasses: [
        'Economy',
        'Premium Economy'
      ],
      limit: 'All limit INR 100000; classes: Economy, Premium Economy',
      status: 'Active'
    }
  ];

  private readonly usersUrl =
    `${environment.apiUrl}/users`;

  private readonly policiesUrl =
    `${environment.apiUrl}/policies`;

  listUsers(): Observable<AdminUser[]> {

    return this.http
      .get<any[]>(this.usersUrl)
      .pipe(
        map(users =>
          users.map(user =>
            this.normalizeUser(user)
          )
        )
      );
  }

  getUserById(id:number):Observable<AdminUser>{

    return this.http
      .get<any>(
        `${this.usersUrl}/${id}`
      )
      .pipe(
        map(user =>
          this.normalizeUser(user)
        )
      );
  }

  createUser(
    user:SaveAdminUser
  ):Observable<AdminUser>{

    return this.http
      .post<any>(
        this.usersUrl,
        this.toSavePayload(user)
      )
      .pipe(
        map(user =>
          this.normalizeUser(user)
        )
      );
  }

  updateUser(
    id:number,
    user:SaveAdminUser
  ):Observable<AdminUser>{

    return this.http
      .put<any>(
        `${this.usersUrl}/${id}`,
        this.toSavePayload(user)
      )
      .pipe(
        map(user =>
          this.normalizeUser(user)
        )
      );
  }

  removeUser(
    id:number
  ):Observable<void>{

    return this.http
      .delete<void>(
        `${this.usersUrl}/${id}`
      );
  }

  listPolicies():Observable<Policy[]>{

    return this.http
      .get<Policy[]>(
        this.policiesUrl
      );
  }

  getPolicies(): Policy[] {

    return this.policies;

  }

  savePolicy(
    policy: Policy
  ): void {

    const policyToSave: Policy = {
      ...policy,
      id:
        policy.id ||
        `POL-${Date.now()}`
    };

    this.policies = [
      policyToSave,
      ...this.policies
    ];

  }

  createPolicy(
    policy:Policy
  ):Observable<Policy>{

    return this.http
      .post<Policy>(
        this.policiesUrl,
        policy
      );
  }

  removePolicy(
    id:number
  ):Observable<void>{

    return this.http
      .delete<void>(
        `${this.policiesUrl}/${id}`
      );
  }

  private toSavePayload(
    user:SaveAdminUser
  ){

    return {

      firstName:
      user.firstName.trim(),

      lastName:
      user.lastName.trim(),

      email:
      user.email.trim(),

      password:
      user.password?.trim(),

      role:
      user.role,

      department:
      user.department.trim(),

      managerId:
      user.managerId,

      enabled:
      user.enabled

    };

  }

  private normalizeUser(
    user:any
  ):AdminUser{

    return {

      id:
      user.id,

      firstName:
      user.firstName ||
      user.firstname ||
      '',

      lastName:
      user.lastName ||
      user.lastname ||
      '',

      email:
      user.email ||
      '',

      role:
      user.role,

      department:
      user.department ||
      '',

      managerId:
      user.managerId ??
      null,

      managerName:
      user.managerName ||
      '',

      enabled:
      user.enabled ??
      true,

      createdAt:
      user.createdAt

    };

  }

}
