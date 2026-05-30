import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Expense } from '@core/models/expense.model';
import { TravelRequest } from '@core/models/travel-request.model';
import { AuthService } from '@core/services/auth.service';
import { ExpenseService } from '@core/services/expense.service';
import { TravelRequestService } from '@core/services/travel-request.service';

interface ExpenseDraft {
  travelRequestId?: string;
  category?: Expense['category'];
  amount?: number;
  expenseDate?: string;
  segmentType?: string;
  fromLocation?: string;
  toLocation?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  proofFileName?: string;
  selectedFileName?: string;
}

@Component({
  selector: 'app-expense',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './expense.component.html',
  styleUrl: './expense.component.scss'
})
export class ExpenseComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly expenseService = inject(ExpenseService);
  private readonly travelRequestService = inject(TravelRequestService);
  private readonly fb = inject(FormBuilder);

  readonly maxReceiptSize = 5 * 1024 * 1024;
  readonly categories: { value: Expense['category']; label: string }[] = [
    { value: 'FOOD', label: 'FOOD 🍔' },
    { value: 'HOTEL', label: 'HOTEL 🏨' },
    { value: 'TRANSPORT', label: 'TRANSPORT 🚕' },
    { value: 'FLIGHT', label: 'FLIGHT ✈' },
    { value: 'TRAIN', label: 'TRAIN 🚆' },
    { value: 'CAR_RENTAL', label: 'CAR RENTAL 🚗' },
    { value: 'OTHER', label: 'OTHER 📦' }
  ];
  readonly workflowStages = [
    'Travel Request',
    'Manager Approved',
    'Finance Approved',
    'Expense Submission',
    'Reimbursement'
  ];
  readonly segmentTypes = ['Flight', 'Train', 'Cab', 'Hotel', 'Meal', 'Other'];

  message = '';
  loading = true;
  requestId = this.route.snapshot.paramMap.get('requestId') ?? '';
  request: TravelRequest | null = null;
  approvedRequests: TravelRequest[] = [];
  expenses: Expense[] = [];
  selectedFileName = '';

  expenseForm = this.fb.nonNullable.group({
    travelRequestId: ['', Validators.required],
    category: ['FOOD' as Expense['category'], Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    expenseDate: ['', [Validators.required, this.travelDateValidator.bind(this)]],
    segmentType: ['', Validators.required],
    fromLocation: ['', Validators.required],
    toLocation: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    description: [''],
    proofFileName: ['']
  });

  constructor() {
    this.loadPage();
  }

  get totalExpenseAmount(): number {
    return this.expenses.reduce((total, expense) => total + Number(expense.amount), 0);
  }

  get pendingExpenseAmount(): number {
    return this.totalByStatus('PENDING');
  }

  get approvedExpenseAmount(): number {
    return this.expenses
      .filter((expense) => expense.reimbursementStatus === 'APPROVED' || expense.reimbursementStatus === 'REIMBURSED')
      .reduce((total, expense) => total + Number(expense.amount), 0);
  }

  get rejectedExpenseAmount(): number {
    return this.totalByStatus('REJECTED');
  }

  get travelDateRangeLabel(): string {
    if (!this.request) return 'Travel dates unavailable';
    return `${this.formatDate(this.request.startDate)} - ${this.formatDate(this.request.endDate)}`;
  }

  get travelStartDateInput(): string {
    return this.toDateInputValue(this.request?.startDate);
  }

  get travelEndDateInput(): string {
    return this.toDateInputValue(this.request?.endDate);
  }

  get draftKey(): string {
    return `expense-draft-${this.requestId}`;
  }

  addExpense(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      this.message = 'Please complete all required expense fields.';
      return;
    }

    this.expenseService.addExpense(this.toExpense()).subscribe({
      next: () => {
        this.message = 'Expense submitted for finance reimbursement.';
        this.expenseForm.reset({
          travelRequestId: this.requestId,
          category: 'FOOD',
          amount: 0,
          expenseDate: '',
          segmentType: '',
          fromLocation: '',
          toLocation: '',
          startTime: '',
          endTime: '',
          description: '',
          proofFileName: ''
        });
        this.selectedFileName = '';
        localStorage.removeItem(this.draftKey);
        this.loadExpenses();
      },
      error: () => this.message = 'Could not submit expense.'
    });
  }

  saveDraft(): void {
    const draft = {
      ...this.expenseForm.getRawValue(),
      selectedFileName: this.selectedFileName
    };

    localStorage.setItem(this.draftKey, JSON.stringify(draft));
    this.message = 'Draft saved on this device.';
  }

  onProofSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.applyReceiptFile(input.files?.[0] ?? null, input);
  }

  onReceiptDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onReceiptDrop(event: DragEvent): void {
    event.preventDefault();
    this.applyReceiptFile(event.dataTransfer?.files?.[0] ?? null);
  }

  viewReceipt(expense: Expense): void {
    if (!expense.proofFileName) {
      this.message = 'No receipt attached to this expense.';
      return;
    }

    this.message = `Receipt attached: ${expense.proofFileName}`;
  }

  formatRequestNumber(id = this.requestId): string {
    if (!id) return 'TRV-0000';
    if (id.toUpperCase().startsWith('TRV-')) return id;

    const numericId = Number(id);
    return Number.isFinite(numericId) ? `TRV-${String(numericId).padStart(4, '0')}` : `TRV-${id}`;
  }

  formatDate(value?: string): string {
    if (!value) return 'Not available';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  }

  getCategoryLabel(category: Expense['category']): string {
    if (category === 'STAY') return 'HOTEL 🏨';
    return this.categories.find((item) => item.value === category)?.label ?? category;
  }

  getDisplayStatus(status: Expense['reimbursementStatus']): string {
    if (status === 'PENDING') return 'Submitted';
    if (status === 'REIMBURSED') return 'Approved';
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  formatRequestStatus(status?: string): string {
    if (!status) return 'Not available';
    return status
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getStatusClass(status: Expense['reimbursementStatus']): string {
    if (status === 'APPROVED' || status === 'REIMBURSED') return 'status-approved';
    if (status === 'REJECTED') return 'status-rejected';
    return 'status-submitted';
  }

  getWorkflowStageClass(index: number): string {
    const currentIndex = this.currentWorkflowStageIndex();

    if (index < currentIndex) return 'is-complete';
    if (index === currentIndex) return 'is-active';
    return '';
  }

  private toExpense(): Expense {
    const now = new Date().toISOString();
    const value = this.expenseForm.getRawValue();
    const user = this.authService.currentUser();

    return {
      id: '',
      travelRequestId: value.travelRequestId,
      employeeId: this.authService.currentUserId(),
      employeeEmail: user?.email || '',
      employeeName: user?.name || '',
      category: value.category,
      amount: Number(value.amount),
      expenseDate: value.expenseDate,
      segmentType: value.segmentType,
      fromLocation: value.fromLocation,
      toLocation: value.toLocation,
      startTime: value.startTime,
      endTime: value.endTime,
      description: value.description,
      proofFileName: value.proofFileName,
      reimbursementStatus: 'PENDING',
      financeComment: '',
      createdAt: now,
      updatedAt: now
    };
  }

  private loadPage(): void {
    this.travelRequestService.getRequestById(this.requestId).subscribe({
      next: (request) => {
        this.request = request;
        this.approvedRequests = request.status === 'FINANCE_APPROVED' ? [request] : [];
        this.expenseForm.patchValue({ travelRequestId: this.requestId });
        this.expenseForm.controls.expenseDate.updateValueAndValidity();
        this.loadDraft();

        if (request.status !== 'FINANCE_APPROVED') {
          this.message = 'Expenses can be submitted only after finance approves this request.';
        }

        this.loadExpenses();
      },
      error: () => {
        this.message = 'Unable to load travel request.';
        this.loading = false;
      }
    });
  }

  private loadExpenses(): void {
    this.expenseService.getMyExpenses().subscribe({
      next: (expenses) => {
        this.expenses = expenses.filter((expense) => expense.travelRequestId === this.requestId);
        this.loading = false;
      },
      error: () => {
        this.message = 'Unable to load expenses.';
        this.loading = false;
      }
    });
  }

  private applyReceiptFile(file: File | null, input?: HTMLInputElement): void {
    if (!file) {
      this.selectedFileName = '';
      this.expenseForm.patchValue({ proofFileName: '' });
      return;
    }

    const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const isAcceptedExtension = /\.(pdf|jpe?g|png)$/i.test(file.name);

    if ((!acceptedTypes.includes(file.type) && !isAcceptedExtension) || file.size > this.maxReceiptSize) {
      this.selectedFileName = '';
      this.expenseForm.patchValue({ proofFileName: '' });
      if (input) input.value = '';
      this.message = 'Upload a PDF, JPG, or PNG receipt up to 5MB.';
      return;
    }

    this.selectedFileName = file.name;
    this.expenseForm.patchValue({ proofFileName: this.selectedFileName });
  }

  private travelDateValidator(control: AbstractControl<string>): ValidationErrors | null {
    if (!control.value || !this.request) return null;

    const expenseDate = this.toDateOnlyTime(control.value);
    const startDate = this.toDateOnlyTime(this.request.startDate);
    const endDate = this.toDateOnlyTime(this.request.endDate);

    if (!expenseDate || !startDate || !endDate) return null;
    return expenseDate >= startDate && expenseDate <= endDate ? null : { travelDateRange: true };
  }

  private toDateOnlyTime(value: string): number | null {
    const [datePart] = value.split('T');
    const date = new Date(`${datePart}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }

  private toDateInputValue(value?: string): string {
    if (!value) return '';
    return value.split('T')[0] ?? '';
  }

  private totalByStatus(status: Expense['reimbursementStatus']): number {
    return this.expenses
      .filter((expense) => expense.reimbursementStatus === status)
      .reduce((total, expense) => total + Number(expense.amount), 0);
  }

  private currentWorkflowStageIndex(): number {
    if (this.expenses.some((expense) => expense.reimbursementStatus === 'REIMBURSED')) return 4;
    if (this.request?.status === 'FINANCE_APPROVED' || this.expenses.length > 0) return 3;
    if (this.request?.status === 'MANAGER_APPROVED') return 2;
    if (this.request?.status === 'SUBMITTED') return 1;
    return 0;
  }

  private loadDraft(): void {
    const savedDraft = localStorage.getItem(this.draftKey);
    if (!savedDraft) return;

    try {
      const draft = JSON.parse(savedDraft) as ExpenseDraft;

      this.expenseForm.patchValue({
        travelRequestId: this.requestId,
        category: draft.category ?? 'FOOD',
        amount: Number(draft.amount) || 0,
        expenseDate: draft.expenseDate ?? '',
        segmentType: draft.segmentType ?? '',
        fromLocation: draft.fromLocation ?? '',
        toLocation: draft.toLocation ?? '',
        startTime: draft.startTime ?? '',
        endTime: draft.endTime ?? '',
        description: draft.description ?? '',
        proofFileName: draft.proofFileName ?? ''
      });
      this.selectedFileName = draft.selectedFileName ?? draft.proofFileName ?? '';
    } catch {
      localStorage.removeItem(this.draftKey);
    }
  }
}
