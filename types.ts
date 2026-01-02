export enum JobStatus {
  RECEIVED = 'Received',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  DELIVERED = 'Delivered'
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  address?: string;
  createdAt: number;
}

export interface Vehicle {
  id: string;
  customerId: string;
  vehicleNumber: string;
  brand: string;
  model: string;
  type: string;
  color?: string;
}

export interface Job {
  id: string;
  vehicleId: string;
  customerId: string;
  services: string;
  dateIn: number;
  expectedDeliveryDate: number;
  charges?: number;
  status: JobStatus;
}

export type AppView = 'dashboard' | 'jobs' | 'customers' | 'add-job' | 'marketing' | 'reports';

export interface DashboardStats {
  todayTotal: number;
  wipCount: number;
  completedCount: number;
  pendingDelivery: number;
}