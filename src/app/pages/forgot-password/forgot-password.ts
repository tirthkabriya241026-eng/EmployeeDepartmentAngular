import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPassword {
  private authService = inject(AuthService);

  email = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.email.trim()) {
      this.errorMessage = 'Email is required';
      return;
    }

    this.isLoading = true;

    this.authService.forgotPassword({ email: this.email.trim().toLowerCase() }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.successMessage = res?.message || 'If an account exists for this email address, a password reset link has been sent.';
        this.email = '';
      },
      error: () => {
        this.isLoading = false;
        this.successMessage = 'If an account exists for this email address, a password reset link has been sent.';
      }
    });
  }
}
