import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { ToastService } from '../../shared/toast/toast.service';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const np = group.get('newPassword')?.value;
  const cp = group.get('confirmPassword')?.value;
  if (np && cp && np !== cp) {
    group.get('confirmPassword')?.setErrors({ mismatch: true });
    return { mismatch: true };
  }
  const cpErrors = group.get('confirmPassword')?.errors;
  if (cpErrors?.['mismatch']) {
    const { mismatch, ...rest } = cpErrors;
    group.get('confirmPassword')?.setErrors(Object.keys(rest).length ? rest : null);
  }
  return null;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePassword implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  mode: 'authenticated' | 'forgot' = 'authenticated';
  form!: FormGroup;
  isLoading = false;
  succeeded = false;

  showCurrent = false;
  showNew = false;
  showConfirm = false;

  constructor() {
    const navState = typeof window !== 'undefined'
      ? (window.history.state as { fromForgot?: boolean } | undefined)
      : undefined;
    if (navState?.fromForgot) {
      this.mode = 'forgot';
    }
    this.form = this.buildForm();
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn() && this.mode !== 'forgot') {
      this.router.navigate(['/login']);
    }
  }

  private buildForm(): FormGroup {
    if (this.mode === 'forgot') {
      return this.fb.group({
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      }, { validators: passwordsMatchValidator });
    }
    return this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: passwordsMatchValidator });
  }

  get currentCtrl() { return this.form.get('currentPassword'); }
  get newCtrl() { return this.form.get('newPassword')!; }
  get confirmCtrl() { return this.form.get('confirmPassword')!; }

  get currentInvalid() { return this.currentCtrl?.touched && this.currentCtrl?.invalid; }
  get newInvalid() { return this.newCtrl.touched && this.newCtrl.invalid; }
  get confirmInvalid() { return this.confirmCtrl.touched && this.confirmCtrl.invalid; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    if (this.mode === 'forgot') {
      const payload = {
        newPassword: this.newCtrl.value,
        confirmPassword: this.confirmCtrl.value,
      };
      this.authService.resetPassword(payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.succeeded = true;
          this.toastService.success('Password reset successfully.');
        },
        error: (err: any) => {
          this.isLoading = false;
          this.toastService.error(err?.error?.message || 'Password reset failed.');
        },
      });
    } else {
      const payload = {
        currentPassword: this.currentCtrl?.value,
        newPassword: this.newCtrl.value,
        confirmPassword: this.confirmCtrl.value,
      };
      this.authService.resetPassword(payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.succeeded = true;
          this.toastService.success('Password changed successfully.');
        },
        error: (err: any) => {
          this.isLoading = false;
          this.toastService.error(err?.error?.message || 'Password change failed.');
        },
      });
    }
  }

  goToDashboard(): void {
    this.router.navigate([this.mode === 'forgot' ? '/login' : '/dashboard']);
  }
}
