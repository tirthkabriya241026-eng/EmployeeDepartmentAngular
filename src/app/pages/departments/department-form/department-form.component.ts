import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { DepartmentService } from '../../../core/services/department';
import { Department, DepartmentRequest } from '../../../models/department.model';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-department-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './department-form.component.html',
  styleUrl: './department-form.component.css'
})
export class DepartmentFormComponent implements OnInit, OnChanges {

  @Input() department: Department | null = null;
  @Output() saved  = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private fb      = inject(FormBuilder);
  private deptSvc = inject(DepartmentService);
  private toast   = inject(ToastService);

  form!: FormGroup;
  submitting = false;

  get isEdit(): boolean { return !!this.department; }

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['department'] && this.form) {
      this.initForm();
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name:     [this.department?.deptName ?? '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      location: [this.department?.location ?? '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
    });
  }

  f(name: string) { return this.form.get(name)!; }

  isInvalid(name: string): boolean {
    const c = this.f(name);
    return c.invalid && (c.dirty || c.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;

    const { name, location } = this.form.value;
    const payload: DepartmentRequest = {
      deptId:   this.isEdit ? this.department!.deptId : undefined,
      deptName: name?.trim(),
      location: location?.trim()
    };

    const req$ = this.isEdit
      ? this.deptSvc.update(this.department!.deptId, payload)
      : this.deptSvc.create(payload);

    req$.subscribe({
      next: () => {
        this.toast.success(`Department ${this.isEdit ? 'updated' : 'created'} successfully.`);
        this.submitting = false;
        this.saved.emit();
      },
      error: (err: Error) => {
        this.toast.error(err.message);
        this.submitting = false;
      }
    });
  }
}
