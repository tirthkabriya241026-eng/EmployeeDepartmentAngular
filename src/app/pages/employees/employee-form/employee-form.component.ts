import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { EmployeeService, EmployeeOption } from '../../../core/services/employee';
import { DepartmentService, DepartmentOption } from '../../../core/services/department';
import { Employee, EmployeeRequest } from '../../../models/employee.model';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeFormComponent implements OnInit, OnDestroy {

  @Input() employee: Employee | null = null;
  @Output() saved  = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private fb      = inject(FormBuilder);
  private empSvc  = inject(EmployeeService);
  private deptSvc = inject(DepartmentService);
  private toast   = inject(ToastService);
  private cdr     = inject(ChangeDetectorRef);

  private readonly destroy$ = new Subject<void>();

  form!: FormGroup;
  departments: DepartmentOption[] = [];
  managers:    EmployeeOption[]   = [];
  submitting       = false;
  dropdownsLoading = true;

  get isEdit(): boolean { return !!this.employee; }

  

  ngOnInit(): void {
    this.buildForm();

    
    const excludeId = this.isEdit ? this.employee!.empId : undefined;

    forkJoin({
      departments: this.deptSvc.getForDropdown(),
      managers:    this.empSvc.getForDropdown(excludeId),
    })
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.dropdownsLoading = false;
        this.cdr.markForCheck();
      })
    )
    .subscribe({
      next: ({ departments, managers }) => {
        this.departments = departments;
        this.managers    = managers;

        
        if (this.isEdit && this.employee) {
          const emp = this.employee;
          this.form.patchValue({
            name:         emp.name      ?? '',
            email:        emp.email     ?? '',
            salary:       emp.salary    ?? null,
            departmentId: emp.deptId    != null ? String(emp.deptId)    : '',
            managerId:    emp.managerId != null ? String(emp.managerId) : '',
          }, { emitEvent: false });
        }

        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load form data. Please try again.');
        this.cdr.markForCheck();
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  

  private buildForm(): void {
    this.form = this.fb.group({
      name:         ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email:        ['', [Validators.required, Validators.email]],
      salary:       [null, [Validators.required, Validators.min(0)]],
      departmentId: ['', [Validators.required]],
      managerId:    [''],
    });
  }

  f(name: string) { return this.form.get(name)!; }

  isInvalid(name: string): boolean {
    const c = this.f(name);
    return c.invalid && (c.dirty || c.touched);
  }

  

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.cdr.markForCheck(); return; }
    if (this.dropdownsLoading) return;

    this.submitting = true;
    this.cdr.markForCheck();

    const v = this.form.value;

    const payload: EmployeeRequest = {
      name:      (v.name  as string).trim(),
      email:     (v.email as string).trim(),
      salary:    Number(v.salary),
      deptId:    Number(v.departmentId),
      managerId: (v.managerId === '' || v.managerId == null) ? null : Number(v.managerId),
    };

    const req$ = this.isEdit
      ? this.empSvc.update(this.employee!.empId, payload)
      : this.empSvc.create(payload);

    req$.pipe(
      takeUntil(this.destroy$),
      finalize(() => { this.submitting = false; this.cdr.markForCheck(); })
    ).subscribe({
      next:  () => {
        this.toast.success(`Employee ${this.isEdit ? 'updated' : 'created'} successfully.`);
        this.saved.emit();
      },
      error: (err: Error) => this.toast.error(err.message),
    });
  }
}
