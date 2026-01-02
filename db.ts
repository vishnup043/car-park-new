import { Customer, Vehicle, Job, JobStatus } from './types';

const STORAGE_KEYS = {
  CUSTOMERS: 'autocare_customers',
  VEHICLES: 'autocare_vehicles',
  JOBS: 'autocare_jobs',
  CONFIG: 'autocare_config'
};

export interface ShopConfig {
  groupInviteLink: string;
}

export const db = {
  getCustomers: (): Customer[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]'),
  saveCustomer: (customer: Customer) => {
    const list = db.getCustomers();
    const existingIndex = list.findIndex(c => c.id === customer.id);
    if (existingIndex > -1) list[existingIndex] = customer;
    else list.push(customer);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(list));
  },

  getVehicles: (): Vehicle[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]'),
  saveVehicle: (vehicle: Vehicle) => {
    const list = db.getVehicles();
    const existingIndex = list.findIndex(v => v.id === vehicle.id);
    if (existingIndex > -1) list[existingIndex] = vehicle;
    else list.push(vehicle);
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(list));
  },

  getJobs: (): Job[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || '[]'),
  saveJob: (job: Job) => {
    const list = db.getJobs();
    const existingIndex = list.findIndex(j => j.id === job.id);
    if (existingIndex > -1) list[existingIndex] = job;
    else list.push(job);
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(list));
  },

  updateJobStatus: (jobId: string, status: JobStatus) => {
    const list = db.getJobs();
    const job = list.find(j => j.id === jobId);
    if (job) {
      job.status = status;
      localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(list));
      return job;
    }
    return null;
  },

  getConfig: (): ShopConfig => {
    const defaultVal = { groupInviteLink: '' };
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
      return stored ? JSON.parse(stored) : defaultVal;
    } catch {
      return defaultVal;
    }
  },

  saveConfig: (config: ShopConfig) => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }
};