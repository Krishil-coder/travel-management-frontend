import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.scss']
})
export class EmployeeComponent {
  userProfile = {
    name: 'Krishil Shah',
    email: 'krishil.shah@company.com',
    role: 'Senior Developer',
    department: 'Engineering',
    joinDate: '15 Jan 2022',
    reportsTo: 'Manager Name'
  };
}
