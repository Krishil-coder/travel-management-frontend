import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss']
})
export class StatusBadgeComponent {
  @Input({ required: true }) label = '';

  get variant(): string {
    const normalized = this.label.toLowerCase();
    if (normalized.includes('approved') || normalized.includes('active')) return 'success';
    if (normalized.includes('pending') || normalized.includes('draft') || normalized.includes('submitted')) return 'warning';
    if (normalized.includes('reject')) return 'danger';
    return 'info';
  }
}
