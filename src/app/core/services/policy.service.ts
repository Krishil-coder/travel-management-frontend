import { Injectable, inject } from '@angular/core';
import { PolicyViolation, TravelRequest } from '../models/travel-request.model';
import { AdminService } from './admin.service';

@Injectable({ providedIn: 'root' })
export class PolicyService {
  private readonly adminService = inject(AdminService);

  evaluateRequest(request: TravelRequest): PolicyViolation[] {
    const activePolicies = this.adminService.getPolicies().filter((policy) => policy.status === 'Active');
    const matchingPolicy =
      activePolicies.find((policy) => policy.department === request.department) ??
      activePolicies.find((policy) => policy.department === 'All');
    const violations: PolicyViolation[] = [];

    if (!matchingPolicy) {
      return violations;
    }

    if (Number(request.estimatedCost) > matchingPolicy.maxBudget) {
      violations.push({
        policyId: matchingPolicy.id,
        title: matchingPolicy.title,
        severity: 'Critical',
        message: `Estimated cost exceeds ${matchingPolicy.department} limit of INR ${matchingPolicy.maxBudget}.`
      });
    }

    if (!matchingPolicy.allowedClasses.includes(request.travelClass)) {
      violations.push({
        policyId: matchingPolicy.id,
        title: matchingPolicy.title,
        severity: 'Warning',
        message: `${request.travelClass} is not allowed by ${matchingPolicy.title}.`
      });
    }

    return violations;
  }
}
