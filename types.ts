export enum JobStatus {
  RECEIVED = 'Received',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  DELIVERED = 'Delivered'
}

// Unified Record: Every job contains the snapshots of customer and vehicle info
export interface Job {
  id: string;
  customerName: string;
  customerMobile: string;
  customerAddress?: string;
  vehicleNumber: string;
  brand: string;
  model: string;
  type: string;
  color?: string;
  services: string;
  dateIn: string; // Changed to string for consistency and reliability
  expectedDeliveryDate: string; // Changed to string to match SQL TEXT column
  charges?: number;
  status: JobStatus;
}

// Logical customer profile derived from the job history
export interface Customer {
  id: string; // Used as a temporary reference in UI
  name: string;
  mobile: string;
  address?: string;
  createdAt: string; // Changed to string
}

export type AppView = 'dashboard' | 'jobs' | 'customers' | 'add-job' | 'marketing' | 'reports';

export interface DashboardStats {
  todayTotal: number;
  wipCount: number;
  completedCount: number;
  pendingDelivery: number;
}