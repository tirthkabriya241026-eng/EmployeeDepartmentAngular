import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  removing?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {

  private counter = 0;
  toasts = signal<Toast[]>([]);

  show(message: string, type: ToastType = 'info', duration = 3500): void {
    // Deduplicate: don't show the same message+type if already visible
    const already = this.toasts().some(t => t.message === message && t.type === type && !t.removing);
    if (already) return;

    const id = ++this.counter;
    this.toasts.update(t => [...t, { id, type, message }]);
    setTimeout(() => this.remove(id), duration);
  }

  success(message: string): void { this.show(message, 'success'); }
  error(message: string): void   { this.show(message, 'error', 5000); }
  warning(message: string): void { this.show(message, 'warning'); }
  info(message: string): void    { this.show(message, 'info'); }

  remove(id: number): void {
    this.toasts.update(t => t.map(x => x.id === id ? { ...x, removing: true } : x));
    setTimeout(() => this.toasts.update(t => t.filter(x => x.id !== id)), 350);
  }
}
