export type ItineraryType = 'FLIGHT' | 'TRAIN' | 'BUS' | 'CAB' | 'HOTEL' | 'MEETING' | 'OTHER';
export type ItineraryStatus = 'PLANNED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface ItineraryItem {
  id: string;
  travelRequestId: string;
  segmentType?: ItineraryType;
  type: ItineraryType;
  fromLocation: string;
  toLocation: string;
  startDateTime: string;
  endDateTime: string;
  notes: string;
  status: ItineraryStatus;
  createdAt: string;
}
