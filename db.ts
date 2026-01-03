import { createClient } from '@supabase/supabase-js';
import { Job, JobStatus, Customer } from './types';

const SUPABASE_URL = 'https://vfrpzuceyhcfmaoabxkt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_MPjy2-QUABnpjHJw-sePUA_ujv6-Bs2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const STORAGE_KEYS = {
  JOBS: 'autocare_flat_jobs',
  CONFIG: 'autocare_config'
};

export interface ShopConfig {
  groupInviteLink: string;
}

let _jobs: Job[] = [];
let _config: ShopConfig = { groupInviteLink: '' };

// Helper to normalize dates from the DB (handles numeric strings, numbers, and ISO dates)
const normalizeDate = (val: any): string => {
  if (!val) return new Date().toISOString().split('T')[0];
  // If it's a numeric timestamp string or number, convert to ISO date
  if (!isNaN(val) && !String(val).includes('-')) {
    const d = new Date(Number(val));
    return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
  }
  // Try parsing as ISO/standard date string
  const d = new Date(val);
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  
  // Return YYYY-MM-DD for consistency
  return d.toISOString().split('T')[0];
};

export const db = {
  init: async () => {
    try {
      const [
        { data: jobs, error: jobsError },
        { data: configs, error: configError }
      ] = await Promise.all([
        supabase.from('customers').select('*'),
        supabase.from('config').select('*').eq('id', 'main').single()
      ]);

      if (jobsError) throw jobsError;
      
      _jobs = (jobs || []).map(j => ({
        ...j,
        dateIn: normalizeDate(j.dateIn),
        expectedDeliveryDate: normalizeDate(j.expectedDeliveryDate)
      }));

      if (configs) {
        _config = configs as unknown as ShopConfig;
      }
      console.log('Database synchronized with Supabase successfully');
    } catch (error: any) {
      console.error('Initial database sync failed:', error.message || error);
      _jobs = JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || '[]');
      _config = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIG) || '{"groupInviteLink":""}');
    }
  },

  getJobs: (): Job[] => _jobs,

  saveJob: async (job: Job) => {
    const list = [..._jobs];
    const index = list.findIndex(j => j.id === job.id);
    if (index > -1) list[index] = job;
    else list.push(job);
    _jobs = list;

    // Cache locally
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(list));

    // Persist to Supabase
    const { error } = await supabase.from('customers').upsert({
      id: job.id,
      customerName: job.customerName,
      customerMobile: job.customerMobile,
      customerAddress: job.customerAddress,
      vehicleNumber: job.vehicleNumber,
      brand: job.brand,
      model: job.model,
      type: job.type,
      color: job.color,
      services: job.services,
      dateIn: String(job.dateIn), // Saved as string
      expectedDeliveryDate: String(job.expectedDeliveryDate), // Save as TEXT
      charges: job.charges,
      status: job.status
    });

    if (error) {
      console.error('Supabase Error Detail:', error);
      throw new Error(error.message || 'Unknown Supabase Error');
    }
  },

  getCustomers: (): Customer[] => {
    const map = new Map<string, Customer>();
    const sorted = [..._jobs]
      .filter(j => j.dateIn && !isNaN(new Date(j.dateIn).getTime()))
      .sort((a, b) => new Date(b.dateIn).getTime() - new Date(a.dateIn).getTime());
    
    sorted.forEach(job => {
      const mobile = job.customerMobile;
      if (!map.has(mobile)) {
        map.set(mobile, {
          id: job.id,
          name: job.customerName,
          mobile: mobile,
          address: job.customerAddress,
          createdAt: String(job.dateIn)
        });
      }
    });
    return Array.from(map.values());
  },

  updateJobStatus: async (jobId: string, status: JobStatus) => {
    const list = [..._jobs];
    const job = list.find(j => j.id === jobId);
    if (job) {
      job.status = status;
      _jobs = list;
      localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(list));
      const { error } = await supabase.from('customers').update({ status }).eq('id', jobId);
      if (error) throw new Error(error.message || 'Failed to update status in cloud');
      return job;
    }
    return null;
  },

  getConfig: (): ShopConfig => _config,
  saveConfig: async (config: ShopConfig) => {
    _config = config;
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    const { error } = await supabase.from('config').upsert({ id: 'main', ...config });
    if (error) throw new Error(error.message || 'Failed to save config');
  }
};