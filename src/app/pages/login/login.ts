import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { ToastService } from '../../shared/toast/toast.service';
import { LoginRequest } from '../../models/login-request.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false],
  });

  isLoading = false;
  showPassword = false;

  get emailCtrl() { return this.loginForm.get('email')!; }
  get passwordCtrl() { return this.loginForm.get('password')!; }

  get emailInvalid() { return this.emailCtrl.touched && this.emailCtrl.invalid; }
  get emailValid() { return this.emailCtrl.touched && this.emailCtrl.valid; }
  get passwordInvalid() { return this.passwordCtrl.touched && this.passwordCtrl.invalid; }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const loginData: LoginRequest = {
      email: this.emailCtrl.value.trim(),
      password: this.passwordCtrl.value,
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        const token = (response as any)?.data?.token ?? (response as any)?.token;
        if (!token) {
          this.isLoading = false;
          this.toastService.error('Login failed: no token received.');
          return;
        }
        this.authService.setToken(token);
        this.isLoading = false;
        this.toastService.success('Welcome back! Redirecting...');
        setTimeout(() => this.router.navigate(['/dashboard']), 500);
      },
      error: () => {
        this.isLoading = false;
        this.toastService.error('Invalid email or password. Please try again.');
      },
    });
  }

  onSSOClick(provider: 'google' | 'microsoft'): void {
    this.toastService.info(`${provider === 'google' ? 'Google' : 'Microsoft'} SSO is not configured yet.`);
  }

  onForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
}
