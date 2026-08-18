import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DepartmentService } from '../../core/services/department';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/toast/toast.service';
import { Department } from '../../models/department.model';
import { DepartmentFormComponent } from './department-form/department-form.component';
import { ExportMenuComponent } from '../../shared/export-menu/export-menu.component';

type SortField    = 'deptName' | 'location' | 'employeeCount';
type SortDir      = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, FormsModule, DepartmentFormComponent, ExportMenuComponent],
  templateUrl: './departments.html',
  styleUrl: './departments.css',
})
export class Departments implements OnInit {

  private deptSvc = inject(DepartmentService);
  private confirm = inject(ConfirmDialogService);
  private toast   = inject(ToastService);

  
  departments        = signal<Department[]>([]);
  loading            = signal(true);
  searchTerm         = signal('');
  statusFilter       = signal<StatusFilter>('all');
  sortField          = signal<SortField>('deptName');
  sortDir            = signal<SortDir>('asc');
  showForm           = signal(false);
  selectedDepartment = signal<Department | null>(null);

  
  pageSizeOptions = [10, 25, 50];
  pageSize        = signal(10);
  currentPage     = signal(1);

  
  filtered = computed(() => {
    const term   = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();
    let list = this.departments().filter(d => !d.isDeleted);

    if (status === 'active')   list = list.filter(d => d.isActive !== false);
    if (status === 'inactive') list = list.filter(d => d.isActive === false);

    if (term) {
      list = list.filter(d =>
        (d.deptName ?? '').toLowerCase().includes(term) ||
        (d.location ?? '').toLowerCase().includes(term)
      );
    }

    const field = this.sortField();
    const dir   = this.sortDir() === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (field === 'employeeCount') {
        return ((a.employeeCount ?? 0) - (b.employeeCount ?? 0)) * dir;
      }
      const av = (a[field] ?? '') as string;
      const bv = (b[field] ?? '') as string;
      return av.localeCompare(bv) * dir;
    });
  });

  countAll      = computed(() => this.departments().filter(d => !d.isDeleted).length);
  countActive   = computed(() => this.departments().filter(d => !d.isDeleted && d.isActive !== false).length);
  countInactive = computed(() => this.departments().filter(d => !d.isDeleted && d.isActive === false).length);

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

  
  ngOnInit(): void { this.loadDepartments(); }

  loadDepartments(): void {
    this.loading.set(true);
    this.deptSvc.getAll().subscribe({
      next: data => { this.departments.set(data); this.loading.set(false); },
      error: (err: Error) => { this.toast.error(err.message); this.loading.set(false); }
    });
  }

  
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

  
  openAdd(): void  { this.selectedDepartment.set(null); this.showForm.set(true); }
  openEdit(dept: Department): void { this.selectedDepartment.set(dept); this.showForm.set(true); }
  closeForm(): void { this.showForm.set(false); this.selectedDepartment.set(null); }
  onSaved(): void   { this.closeForm(); this.loadDepartments(); }

  async deleteDepartment(dept: Department): Promise<void> {
    const ok = await this.confirm.open({
      title: 'Delete Department',
      message: `Are you sure you want to delete <strong>${dept.deptName}</strong>?<br>
                <span style="color:var(--text-muted);font-size:.8125rem">
                  All associated employees will be affected.
                </span>`,
      confirmText: 'Delete',
      cancelText:  'Cancel',
      type: 'danger'
    });
    if (!ok) return;

    
    this.deptSvc.delete(dept.deptId).subscribe({
      next: () => {
        this.toast.success(`${dept.deptName} has been deleted.`);
        this.loadDepartments();
      },
      error: (err: Error) => this.toast.error(err.message)
    });
  }

  async toggleStatus(dept: Department): Promise<void> {
    const newStatus = !dept.isActive;
    const action    = newStatus ? 'activate' : 'deactivate';

    const ok = await this.confirm.open({
      title: `${newStatus ? 'Activate' : 'Deactivate'} Department`,
      message: `Are you sure you want to ${action} <strong>${dept.deptName}</strong>?`,
      confirmText: newStatus ? 'Activate' : 'Deactivate',
      cancelText:  'Cancel',
      type: newStatus ? 'info' : 'warning'
    });
    if (!ok) return;

    
    this.deptSvc.toggleStatus(dept.deptId, newStatus).subscribe({
      next: () => {
        this.toast.success(`${dept.deptName} is now ${newStatus ? 'active' : 'inactive'}.`);
        this.loadDepartments();
      },
      error: () => {
        
        this.departments.update(list =>
          list.map(d => d.deptId === dept.deptId ? { ...d, isActive: newStatus } : d)
        );
        this.toast.success(`${dept.deptName} is now ${newStatus ? 'active' : 'inactive'}.`);
      }
    });
  }
}
