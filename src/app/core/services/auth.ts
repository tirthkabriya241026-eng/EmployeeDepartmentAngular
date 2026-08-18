import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { LoginRequest } from '../../models/login-request.model';
import { LoginResponse } from '../../models/login-response.model';
import { RegisterRequest } from '../../models/register-request.model';
import { ChangePasswordRequest } from '../../models/change-password-request.model';
import { ForgotPasswordRequest } from '../../models/forgot-password-request.model';
import { ResetPasswordRequest } from '../../models/reset-password-request.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) { }

  login(loginData: LoginRequest): Observable<LoginResponse> {
    
    return this.http.post<LoginResponse>(`${this.apiUrl}/api/Auth/Login`, loginData);
  }

  register(registerData: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/Auth/register`, registerData);
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/Auth/forgot-password`, data);
  }

  resetPassword(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/Auth/reset-password`, data);
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  
  private getPayload(): any | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  
  isLoggedIn(): boolean {
    const payload = this.getPayload();
    if (!payload) return false;
    return payload.exp * 1000 > Date.now();
  }

  
  getRole(): string {
    const payload = this.getPayload();
    if (!payload) return '';
    
    
    const roleKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
    return payload[roleKey] ?? payload['role'] ?? payload['Role'] ?? '';
  }

  
  isAdmin(): boolean {
    return this.getRole() === 'Admin';
  }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}

