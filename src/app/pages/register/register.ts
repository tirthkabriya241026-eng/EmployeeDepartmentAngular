import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { ToastService } from '../../shared/toast/toast.service';
import { RegisterRequest } from '../../models/register-request.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  registerForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  isLoading = false;
  registered = false;
  registeredEmail = '';

  get fullNameCtrl() { return this.registerForm.get('fullName')!; }
  get emailCtrl() { return this.registerForm.get('email')!; }
  get passwordCtrl() { return this.registerForm.get('password')!; }

  get fullNameInvalid() { return this.fullNameCtrl.touched && this.fullNameCtrl.invalid; }
  get fullNameValid() { return this.fullNameCtrl.touched && this.fullNameCtrl.valid; }
  get emailInvalid() { return this.emailCtrl.touched && this.emailCtrl.invalid; }
  get emailValid() { return this.emailCtrl.touched && this.emailCtrl.valid; }
  get passwordInvalid() { return this.passwordCtrl.touched && this.passwordCtrl.invalid; }
  get passwordValid() { return this.passwordCtrl.touched && this.passwordCtrl.valid; }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const payload: RegisterRequest = {
      fullName: this.fullNameCtrl.value.trim(),
      email: this.emailCtrl.value.trim(),
      password: this.passwordCtrl.value,
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.registeredEmail = payload.email;
        this.registered = true;
        this.toastService.success('Account created! Check your email for credentials.');
      },
      error: (err: any) => {
        this.isLoading = false;
        this.toastService.error(this.extractErrorMessage(err));
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  private extractErrorMessage(err: any): string {
    const body = err?.error;
    if (!body) return 'Registration failed. Please try again.';
    if (typeof body === 'string') return body;

    if (body?.message) return body.message;
    if (body?.title) return body.title;

    switch (err?.status) {
      case 400: return 'Invalid data. Please check your inputs.';
      case 409: return 'An account with this email already exists.';
      case 500: return 'Server error. Please try again later.';
      default: return 'Registration failed. Please try again.';
    }
  }
}
