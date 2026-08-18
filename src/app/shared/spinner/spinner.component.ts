import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-overlay" [class.spinner-inline]="inline">
      <div class="spinner-ring">
        <div></div><div></div><div></div><div></div>
      </div>
      @if (message) {
        <p class="spinner-msg">{{ message }}</p>
      }
    </div>
  `,
  styles: [`
    .spinner-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      padding: 40px;
    }
    .spinner-inline {
      padding: 16px;
    }
    .spinner-ring {
      position: relative;
      width: 40px;
      height: 40px;
    }
    .spinner-ring div {
      box-sizing: border-box;
      display: block;
      position: absolute;
      width: 32px;
      height: 32px;
      margin: 4px;
      border: 3px solid transparent;
      border-top-color: var(--cyan-full);
      border-radius: 50%;
      animation: spin 1s cubic-bezier(0.5,0,0.5,1) infinite;
    }
    .spinner-ring div:nth-child(1) { animation-delay: -0.45s; border-top-color: var(--cyan-full); }
    .spinner-ring div:nth-child(2) { animation-delay: -0.3s;  border-top-color: var(--purple-full); }
    .spinner-ring div:nth-child(3) { animation-delay: -0.15s; border-top-color: var(--blue-full); }
    .spinner-ring div:nth-child(4) { border-top-color: var(--cyan-mid); }
    .spinner-msg {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin: 0;
      animation: statusPulse 1.5s ease-in-out infinite;
    }
  `]
})
export class SpinnerComponent {
  @Input() message = '';
  @Input() inline  = false;
}
