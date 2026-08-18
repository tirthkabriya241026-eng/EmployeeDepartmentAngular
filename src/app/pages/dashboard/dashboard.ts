import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EmployeeService } from '../../core/services/employee';
import { DepartmentService } from '../../core/services/department';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DecimalPipe, CurrencyPipe, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  greeting   = 'Good morning';
  dateLabel  = '';

  
  totalEmployees    = 0;
  activeEmployees   = 0;
  inactiveEmployees = 0;
  totalDepartments  = 0;
  avgSalary         = 0;
  loading = true;

  readonly Math = Math;

  constructor(
    private empSvc:  EmployeeService,
    private deptSvc: DepartmentService
  ) {}

  ngOnInit() {
    this.setGreeting();
    this.setDate();
    this.loadStats();
  }

  private setGreeting() {
    const h = new Date().getHours();
    if (h < 12) this.greeting = 'Good morning';
    else if (h < 17) this.greeting = 'Good afternoon';
    else this.greeting = 'Good evening';
  }

  private setDate() {
    this.dateLabel = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  private loadStats() {
    this.loading = true;
    forkJoin({
      employees:   this.empSvc.getAll(),
      departments: this.deptSvc.getAll()
    }).subscribe({
      next: ({ employees, departments }) => {
        this.totalEmployees    = employees.length;
        this.activeEmployees   = employees.filter(e => e.isActive !== false && !e.isDeleted).length;
        this.inactiveEmployees = employees.filter(e => e.isActive === false && !e.isDeleted).length;
        this.totalDepartments  = departments.length;
        this.avgSalary         = employees.length
          ? employees.reduce((sum, e) => sum + (e.salary ?? 0), 0) / employees.length
          : 0;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}
