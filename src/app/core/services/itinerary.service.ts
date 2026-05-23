import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ItineraryItem } from '../models/itinerary.model';

@Injectable({ providedIn: 'root' })
export class ItineraryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/itinerary-items`;

  getItemsForRequest(requestId: string): Observable<ItineraryItem[]> {
    return this.http.get<ItineraryItem[]>(this.baseUrl, { params: { travelRequestId: requestId } });
  }

  addItem(item: ItineraryItem): Observable<ItineraryItem> {
    return this.http.post<ItineraryItem>(this.baseUrl, item);
  }
}
