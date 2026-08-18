import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { ResetPassword } from './pages/reset-password/reset-password';
import { Dashboard } from './pages/dashboard/dashboard';
import { Employees } from './pages/employees/employees';
import { Departments } from './pages/departments/departments';
import { DeletedEmployees } from './pages/deleted-employees/deleted-employees';
import { ChangePassword } from './pages/change-password/change-password';
import { authGuard, loginGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '',               redirectTo: 'login', pathMatch: 'full' },
  { path: 'login',          component: Login,          canActivate: [loginGuard] },
  { path: 'register',       component: Register,       canActivate: [loginGuard] },
  { path: 'forgot-password', component: ForgotPassword, canActivate: [loginGuard] },
  { path: 'reset-password', component: ResetPassword },  // no guard — accessible via email link
  { path: 'dashboard',      component: Dashboard,      canActivate: [authGuard]  },
  { path: 'employees',      component: Employees,      canActivate: [authGuard]  },
  { path: 'departments',    component: Departments,    canActivate: [authGuard]  },
  { path: 'deleted-employees', component: DeletedEmployees, canActivate: [authGuard] },
  { path: 'change-password', component: ChangePassword },   // no guard — handles both modes internally
  { path: '**', redirectTo: 'login' }
];
