import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AuthService } from '../../core/services/auth';
import { ResetPasswordRequest } from '../../models/reset-password-request.model';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css']
})
export class ResetPassword implements OnInit {
  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  tokenError: boolean = false;
  tokenErrorMessage: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Read token from query parameter
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      
      if (!this.token) {
        this.tokenError = true;
        this.tokenErrorMessage = 'Invalid or missing password reset link. Please request a new password reset link.';
      }
    });
  }

  onSubmit(): void {
    // Clear previous messages
    this.errorMessage = '';
    this.successMessage = '';

    // Validate inputs
    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Both password fields are required';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (!this.isValidPassword(this.newPassword)) {
      this.errorMessage = 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character';
      return;
    }

    this.isLoading = true;

    const request: ResetPasswordRequest = {
      token: this.token,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    };

    this.authService.resetPassword(request).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Password has been reset successfully! Redirecting to login...';
        this.newPassword = '';
        this.confirmPassword = '';
        
        // Redirect to login 
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error: any) => {
        this.isLoading = false;
        
        if (error.status === 0) {
          this.errorMessage = 'Unable to connect to backend service. Please ensure the backend API server is running at https://localhost:7130.';
        } else if (error.status === 400) {
          // Token expired or invalid
          const errorMsg = typeof error.error === 'string' ? error.error : (error.error?.message || '');
          const lowerMsg = errorMsg.toLowerCase();
          
          if (lowerMsg.includes('expired')) {
            this.errorMessage = 'Your password reset link has expired. Please request a new password reset link.';
          } else if (lowerMsg.includes('invalid') || lowerMsg.includes('not found')) {
            this.errorMessage = 'Invalid password reset link. Please request a new password reset link.';
          } else if (lowerMsg.includes('used') || lowerMsg.includes('already')) {
            this.errorMessage = 'This password reset link has already been used. Please request a new password reset link.';
          } else {
            this.errorMessage = errorMsg || 'Invalid request. Please try again.';
          }
        } else if (error.status === 500) {
          this.errorMessage = 'An error occurred while resetting your password. Please try again later.';
        } else {
          this.errorMessage = error.error?.message || error.message || 'An unexpected error occurred. Please try again.';
        }
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private isValidPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    return passwordRegex.test(password);
  }

  requestNewResetLink(): void {
    this.router.navigate(['/forgot-password']);
  }
}
