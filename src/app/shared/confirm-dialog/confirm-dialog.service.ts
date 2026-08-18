import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {

  isOpen = signal(false);
  config = signal<ConfirmDialogConfig>({ title: '', message: '' });

  private resolveFn?: (value: boolean) => void;

  open(config: ConfirmDialogConfig): Promise<boolean> {
    this.config.set({ confirmText: 'Confirm', cancelText: 'Cancel', type: 'danger', ...config });
    this.isOpen.set(true);
    return new Promise(resolve => { this.resolveFn = resolve; });
  }

  confirm(): void {
    this.isOpen.set(false);
    this.resolveFn?.(true);
  }

  cancel(): void {
    this.isOpen.set(false);
    this.resolveFn?.(false);
  }
}
