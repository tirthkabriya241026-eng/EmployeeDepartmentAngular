import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd, NavigationStart } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth';
import { filter } from 'rxjs/operators';
import { ToastComponent } from './shared/toast/toast.component';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ToastComponent, ConfirmDialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('EmployeeDepartment.UI');
  isLoginPage = false;
  isNavigating = false;
  isSidebarOpen = false;

  constructor(private router: Router, public authService: AuthService) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd || e instanceof NavigationStart))
      .subscribe((e) => {
        if (e instanceof NavigationStart) {
          this.isNavigating = true;
        } else if (e instanceof NavigationEnd) {
          this.isNavigating = false;
          this.isLoginPage = e.urlAfterRedirects.includes('/login');
        }
      });
  }

  logout(): void {
    this.authService.logout();
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
