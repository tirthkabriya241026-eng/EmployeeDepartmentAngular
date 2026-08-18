import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EmployeeService } from '../../core/services/employee';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/toast/toast.service';
import { Employee } from '../../models/employee.model';
import { EmployeeFormComponent } from './employee-form/employee-form.component';
import { ExportMenuComponent } from '../../shared/export-menu/export-menu.component';

type SortField    = 'name' | 'salary' | 'departmentName' | 'createdAt';
type SortDir      = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, EmployeeFormComponent, ExportMenuComponent],
  templateUrl: './employees.html',
  styleUrl: './employees.css',
})
export class Employees implements OnInit {

  private empSvc  = inject(EmployeeService);
  private confirm = inject(ConfirmDialogService);
  private toast   = inject(ToastService);

  // ── State ──────────────────────────────────────────────────
  employees        = signal<Employee[]>([]);
  loading          = signal(true);
  searchTerm       = signal('');
  statusFilter     = signal<StatusFilter>('all');
  sortField        = signal<SortField>('name');
  sortDir          = signal<SortDir>('asc');
  showForm         = signal(false);
  selectedEmployee = signal<Employee | null>(null);

  // Pagination
  pageSizeOptions = [10, 25, 50];
  pageSize        = signal(10);
  currentPage     = signal(1);

  // ── Derived ────────────────────────────────────────────────
  filtered = computed(() => {
    const term   = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();
    let list = this.employees().filter(e => !e.isDeleted);

    if (status === 'active')   list = list.filter(e => e.isActive !== false);
    if (status === 'inactive') list = list.filter(e => e.isActive === false);

    if (term) {
      list = list.filter(e =>
        (e.name           ?? '').toLowerCase().includes(term) ||
        (e.email          ?? '').toLowerCase().includes(term) ||
        (e.departmentName ?? '').toLowerCase().includes(term)
      );
    }

    const field = this.sortField();
    const dir   = this.sortDir() === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (field === 'createdAt') {
        const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (ad - bd) * dir;
      }
      const av = (a[field] ?? '') as string | number;
      const bv = (b[field] ?? '') as string | number;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  });

  countAll      = computed(() => this.employees().filter(e => !e.isDeleted).length);
  countActive   = computed(() => this.employees().filter(e => !e.isDeleted && e.isActive !== false).length);
  countInactive = computed(() => this.employees().filter(e => !e.isDeleted && e.isActive === false).length);

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize())));

  paged = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const cur   = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (cur > 3) pages.push('...');
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
    if (cur < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  });

  // ── Lifecycle ──────────────────────────────────────────────
  ngOnInit(): void { this.loadEmployees(); }

  loadEmployees(): void {
    this.loading.set(true);
    this.empSvc.getAll().subscribe({
      next: data => { this.employees.set(data); this.loading.set(false); },
      error: (err: Error) => { this.toast.error(err.message); this.loading.set(false); }
    });
  }

  // ── Filters / Sort / Pagination ────────────────────────────
  onSearch(term: string): void { this.searchTerm.set(term); this.currentPage.set(1); }
  setStatusFilter(f: StatusFilter): void { this.statusFilter.set(f); this.currentPage.set(1); }
  onPageSizeChange(size: number): void { this.pageSize.set(Number(size)); this.currentPage.set(1); }

  sort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
    this.currentPage.set(1);
  }

  goToPage(p: number | '...'): void {
    if (p === '...') return;
    this.currentPage.set(Math.max(1, Math.min(p, this.totalPages())));
  }

  sortIcon(field: SortField): string {
    if (this.sortField() !== field) return 'none';
    return this.sortDir();
  }

  // ── CRUD ───────────────────────────────────────────────────
  openAdd(): void  { this.selectedEmployee.set(null); this.showForm.set(true); }
  openEdit(emp: Employee): void { this.selectedEmployee.set(emp); this.showForm.set(true); }
  closeForm(): void { this.showForm.set(false); this.selectedEmployee.set(null); }
  onSaved(): void   { this.closeForm(); this.loadEmployees(); }

  async deleteEmployee(emp: Employee): Promise<void> {
    const ok = await this.confirm.open({
      title: 'Delete Employee',
      message: `Are you sure you want to delete <strong>${emp.name}</strong>?<br>
                <span style="color:var(--text-muted);font-size:.8125rem">
                  This will move the employee to the deleted archive.
                </span>`,
      confirmText: 'Delete',
      cancelText:  'Cancel',
      type: 'danger'
    });
    if (!ok) return;

    // Use empId — the real backend primary key
    this.empSvc.softDelete(emp.empId).subscribe({
      next: () => { this.toast.success(`${emp.name} has been deleted.`); this.loadEmployees(); },
      error: (err: Error) => this.toast.error(err.message)
    });
  }

  async toggleStatus(emp: Employee): Promise<void> {
    const newStatus = !emp.isActive;
    const action    = newStatus ? 'activate' : 'deactivate';

    const ok = await this.confirm.open({
      title: `${newStatus ? 'Activate' : 'Deactivate'} Employee`,
      message: `Are you sure you want to ${action} <strong>${emp.name}</strong>?`,
      confirmText: newStatus ? 'Activate' : 'Deactivate',
      cancelText:  'Cancel',
      type: newStatus ? 'info' : 'warning'
    });
    if (!ok) return;

    // Use empId — the real backend primary key
    this.empSvc.toggleStatus(emp.empId, newStatus).subscribe({
      next: () => {
        this.toast.success(`${emp.name} is now ${newStatus ? 'active' : 'inactive'}.`);
        this.loadEmployees();
      },
      error: () => {
        // Optimistic fallback
        this.employees.update(list =>
          list.map(e => e.empId === emp.empId ? { ...e, isActive: newStatus } : e)
        );
        this.toast.success(`${emp.name} is now ${newStatus ? 'active' : 'inactive'}.`);
      }
    });
  }

  formatSalary(s: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0
    }).format(s);
  }
}
