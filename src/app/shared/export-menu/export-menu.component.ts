import { Component, Input, inject, signal, HostListener} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ExportService } from '../../services/export.service';
import { ToastService } from '../toast/toast.service';

export type ExportEntity = 'employees' | 'departments';

@Component({
  selector: 'app-export-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './export-menu.component.html',
  styleUrl: './export-menu.component.css'
})
export class ExportMenuComponent {

  @Input() entity: ExportEntity = 'employees';

  private exportSvc = inject(ExportService);
  private toast     = inject(ToastService);
  

  open         = signal(false);
  loadingExcel = signal(false);
  loadingPdf   = signal(false);

  toggle(e: MouseEvent): void {
    e.stopPropagation();
    this.open.update(v => !v);
  }

  @HostListener('document:click')
  onDocClick(): void {
    this.open.set(false);
  }

  exportExcel(): void {
    if (this.loadingExcel()) return;
    this.open.set(false);
    this.loadingExcel.set(true);
    const req$ = this.entity === 'employees'
      ? this.exportSvc.exportEmployeesExcel()
      : this.exportSvc.exportDepartmentsExcel();
    this.run(req$, 'xlsx', () => this.loadingExcel.set(false));
  }

  exportPdf(): void {
    if (this.loadingPdf()) return;
    this.open.set(false);
    this.loadingPdf.set(true);
    const req$ = this.entity === 'employees'
      ? this.exportSvc.exportEmployeesPdf()
      : this.exportSvc.exportDepartmentsPdf();
    this.run(req$, 'pdf', () => this.loadingPdf.set(false));
  }

  private run(
    req$: Observable<HttpResponse<Blob>>,
    ext: 'xlsx' | 'pdf',
    done: () => void
  ): void {
    req$.subscribe({
      next: (res) => {
        const blob  = res.body!;
        const cd    = res.headers.get('content-disposition') ?? '';
        const match = cd.match(/filename[^;=\n]*=(['"]?)([^'";\n]+)\1/);
        const label = this.entity === 'employees' ? 'Employees' : 'Departments';
        const filename = match?.[2]?.trim() || `${label}_export.${ext}`;
        this.triggerDownload(blob, filename);
        this.toast.success(`${label} exported successfully.`);
        done();
      },
      error: async (err) => {
        await this.handleBlobError(err);
        done();
      }
    });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private async handleBlobError(err: any): Promise<void> {
    if (err?.error instanceof Blob) {
      try {
        const text = await err.error.text();
        const json = JSON.parse(text);
        this.toast.error(json?.message ?? json?.Message ?? 'Export failed.');
        return;
      } catch { /* fall through */ }
    }
    if (err?.status === 401) { this.toast.error('Unauthorized. Please log in again.'); return; }
    if (err?.status === 404) { this.toast.error('No data available for export.'); return; }
    this.toast.error('Export failed. Please try again.');
  }
}
