import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EmployeeService } from '../../core/services/employee';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/toast/toast.service';
import { Employee } from '../../models/employee.model';

@Component({
  selector: 'app-deleted-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './deleted-employees.html',
  styleUrl: './deleted-employees.css'
})
export class DeletedEmployees implements OnInit {

  private empSvc  = inject(EmployeeService);
  private confirm = inject(ConfirmDialogService);
  private toast   = inject(ToastService);

  employees   = signal<Employee[]>([]);
  loading     = signal(true);
  searchTerm  = signal('');
  pageSize    = signal(10);
  currentPage = signal(1);

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.employees();
    if (!term) return list;
    return list.filter(e =>
      (e.name           ?? '').toLowerCase().includes(term) ||
      (e.email          ?? '').toLowerCase().includes(term) ||
      (e.departmentName ?? '').toLowerCase().includes(term)
    );
  });

  totalPages  = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize())));
  paged       = computed(() => {
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

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    // Use the dedicated /deleted endpoint. If it fails (backend doesn't expose it),
    // fall back to getAll() and filter client-side.
    this.empSvc.getDeleted().subscribe({
      next: data => {
        // getDeleted() already returns only deleted employees from the /deleted endpoint.
        // If the response is empty (backend returned nothing or endpoint doesn't exist),
        // the empty-state UI will be shown.
        this.employees.set(data);
        this.loading.set(false);
      },
      error: () => {
        // Fallback: load all and filter for deleted
        this.empSvc.getAll().subscribe({
          next: all => {
            this.employees.set(all.filter(e => e.isDeleted));
            this.loading.set(false);
          },
          error: () => { this.loading.set(false); }
        });
      }
    });
  }

  onSearch(term: string): void { this.searchTerm.set(term); this.currentPage.set(1); }

  goToPage(p: number | '...'): void {
    if (p === '...') return;
    this.currentPage.set(Math.max(1, Math.min(p, this.totalPages())));
  }

  async restore(emp: Employee): Promise<void> {
    const ok = await this.confirm.open({
      title: 'Restore Employee',
      message: `Restore <strong>${emp.name}</strong> back to the active employee list?`,
      confirmText: 'Restore',
      cancelText: 'Cancel',
      type: 'info'
    });
    if (!ok) return;

    this.empSvc.restore(emp.empId).subscribe({
      next: () => {
        this.toast.success(`${emp.name} has been restored.`);
        this.load();
      },
      error: (err: Error) => this.toast.error(err.message)
    });
  }

  formatSalary(s: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(s);
  }
}
