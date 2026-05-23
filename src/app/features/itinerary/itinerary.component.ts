import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ItineraryItem, ItineraryType } from '@core/models/itinerary.model';
import { TravelRequest } from '@core/models/travel-request.model';
import { ItineraryService } from '@core/services/itinerary.service';
import { TravelRequestService } from '@core/services/travel-request.service';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-itinerary',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StatusBadgeComponent],
  templateUrl: './itinerary.component.html'
})
export class ItineraryComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly itineraryService = inject(ItineraryService);
  private readonly travelRequestService = inject(TravelRequestService);

  readonly types: ItineraryType[] = ['FLIGHT', 'TRAIN', 'BUS', 'CAB', 'HOTEL', 'MEETING', 'OTHER'];
  requestId = this.route.snapshot.paramMap.get('id') ?? '';
  request: TravelRequest | null = null;
  items: ItineraryItem[] = [];
  loading = true;
  message = '';

  itineraryForm = this.fb.nonNullable.group({
    type: ['FLIGHT' as ItineraryType, Validators.required],
    fromLocation: ['', Validators.required],
    toLocation: ['', Validators.required],
    startDateTime: ['', Validators.required],
    endDateTime: ['', Validators.required],
    notes: ['']
  }, { validators: this.dateTimeValidator });

  constructor() {
    this.loadPage();
  }

  addItem(): void {
    if (this.itineraryForm.invalid || !this.requestId) {
      this.itineraryForm.markAllAsTouched();
      return;
    }

    const value = this.itineraryForm.getRawValue();
    const item: ItineraryItem = {
      id: '',
      travelRequestId: this.requestId,
      type: value.type,
      fromLocation: value.fromLocation,
      toLocation: value.toLocation,
      startDateTime: value.startDateTime,
      endDateTime: value.endDateTime,
      notes: value.notes,
      status: 'PLANNED',
      createdAt: ''
    };

    this.itineraryService.addItem(item).subscribe({
      next: () => {
        this.message = 'Itinerary item added.';
        this.itineraryForm.reset({ type: 'FLIGHT', fromLocation: '', toLocation: '', startDateTime: '', endDateTime: '', notes: '' });
        this.loadItems();
      },
      error: () => this.message = 'Could not add itinerary item.'
    });
  }

  private loadPage(): void {
    this.travelRequestService.getRequestById(this.requestId).subscribe({
      next: (request) => {
        this.request = request;
        this.loadItems();
      },
      error: () => {
        this.message = 'Unable to load travel request.';
        this.loading = false;
      }
    });
  }

  private loadItems(): void {
    this.itineraryService.getItemsForRequest(this.requestId).subscribe({
      next: (items) => {
        this.items = items;
        this.loading = false;
      },
      error: () => {
        this.message = 'Unable to load itinerary.';
        this.loading = false;
      }
    });
  }

  private dateTimeValidator(control: AbstractControl): ValidationErrors | null {
    const start = control.get('startDateTime')?.value;
    const end = control.get('endDateTime')?.value;

    if (!start || !end) {
      return null;
    }

    return new Date(end) < new Date(start) ? { dateTimeRange: true } : null;
  }
}
