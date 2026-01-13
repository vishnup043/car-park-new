import { createClient } from '@supabase/supabase-js';
import { Job, JobStatus, Customer } from './types';

const SUPABASE_URL = 'https://vfrpzuceyhcfmaoabxkt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_MPjy2-QUABnpjHJw-sePUA_ujv6-Bs2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface ShopConfig {
  groupInviteLink: string;
  adminPhone1: string;
  adminPhone2: string;
  adminEmail1: string;
  adminEmail2: string;
  adminPin: string;
  recoveryKey: string;
  emailjsServiceId?: string;
  emailjsTemplateId?: string;
  emailjsPublicKey?: string;
}

const generateRecoveryKey = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + 
         Math.random().toString(36).substring(2, 8).toUpperCase();
};

const LOCAL_STORAGE_KEY = 'ncp_local_config_v4';

const getLocalConfig = (): ShopConfig => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse local config");
    }
  }
  return { 
    groupInviteLink: '',
    adminPhone1: '9605877043',
    adminPhone2: '9895908879',
    adminEmail1: '',
    adminEmail2: '',
    adminPin: '1234',
    recoveryKey: generateRecoveryKey(),
    emailjsServiceId: '',
    emailjsTemplateId: '',
    emailjsPublicKey: ''
  };
};

let _jobs: Job[] = [];
let _config: ShopConfig = getLocalConfig();

const normalizeDate = (val: any): string => {
  if (!val) return new Date().toISOString().split('T')[0];
  if (!isNaN(val) && !String(val).includes('-')) {
    const d = new Date(Number(val));
    return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  return d.toISOString().split('T')[0];
};

export const db = {
  init: async () => {
    try {
      // 1. Fetch Jobs (Customers table)
      const { data: jobs, error: jobsError } = await supabase.from('customers').select('*');
      if (jobsError) {
        console.warn('Customers table sync failed:', jobsError.message);
      } else if (jobs) {
        _jobs = jobs.map(j => ({
          ...j,
          // Robust mapping for potential lowercase keys from DB
          customerName: j.customerName ?? j.customername,
          customerMobile: j.customerMobile ?? j.customermobile,
          customerAddress: j.customerAddress ?? j.customeraddress,
          vehicleNumber: j.vehicleNumber ?? j.vehiclenumber,
          expectedDeliveryDate: normalizeDate(j.expectedDeliveryDate ?? j.expecteddeliverydate),
          dateIn: normalizeDate(j.dateIn ?? j.datein),
        }));
      }

      // 2. Fetch Config
      const { data: config, error: configError } = await supabase.from('config').select('*').eq('id', 'main').single();
      
      if (config) {
        // Robust mapping for case-sensitivity issues
        _config = {
          groupInviteLink: config.groupInviteLink ?? config.groupinvitelink ?? _config.groupInviteLink,
          adminPhone1: config.adminPhone1 ?? config.adminphone1 ?? _config.adminPhone1,
          adminPhone2: config.adminPhone2 ?? config.adminphone2 ?? _config.adminPhone2,
          adminEmail1: config.adminEmail1 ?? config.adminemail1 ?? _config.adminEmail1,
          adminEmail2: config.adminEmail2 ?? config.adminemail2 ?? _config.adminEmail2,
          adminPin: config.adminPin ?? config.adminpin ?? _config.adminPin,
          recoveryKey: config.recoveryKey ?? config.recoverykey ?? _config.recoveryKey,
          emailjsServiceId: config.emailjsServiceId ?? config.emailjsserviceid ?? _config.emailjsServiceId,
          emailjsTemplateId: config.emailjsTemplateId ?? config.emailjstemplateid ?? _config.emailjsTemplateId,
          emailjsPublicKey: config.emailjsPublicKey ?? config.emailjspublickey ?? _config.emailjsPublicKey,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(_config));
      }

      console.log('Cloud DB sync complete.');
    } catch (error: any) {
      console.error('Database sync general failure:', error.message || error);
    }
  },

  getJobs: (): Job[] => _jobs,

  saveJob: async (job: Job) => {
    const list = [..._jobs];
    const index = list.findIndex(j => j.id === job.id);
    if (index > -1) list[index] = job;
    else list.push(job);
    _jobs = list;

    // Use quoted keys in payload if possible or rely on the SDK to handle it.
    // Explicit mapping to camelCase.
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
      dateIn: String(job.dateIn),
      expectedDeliveryDate: String(job.expectedDeliveryDate),
      charges: job.charges,
      status: job.status
    });

    if (error) {
      if (error.message.includes('column') && error.message.includes('not found')) {
        throw new Error(`DB Error: Column "${error.message.split("'")[1]}" is missing. Please run schema.sql in Supabase.`);
      }
      throw new Error(error.message || 'Supabase Job Save Error');
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
      const { error } = await supabase.from('customers').update({ status }).eq('id', jobId);
      if (error) throw new Error(error.message || 'Update failed');
      return job;
    }
    return null;
  },

  getConfig: (): ShopConfig => _config,
  
  saveConfig: async (config: ShopConfig) => {
    _config = config;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
    
    const payload = { 
      id: 'main',
      adminPin: config.adminPin,
      groupInviteLink: config.groupInviteLink,
      recoveryKey: config.recoveryKey,
      adminPhone1: config.adminPhone1,
      adminPhone2: config.adminPhone2,
      adminEmail1: config.adminEmail1,
      adminEmail2: config.adminEmail2,
      emailjsServiceId: config.emailjsServiceId,
      emailjsTemplateId: config.emailjsTemplateId,
      emailjsPublicKey: config.emailjsPublicKey
    };

    const { error } = await supabase.from('config').upsert(payload);
    if (error) {
      console.error("Supabase Config sync failed:", error.message);
      // Detailed error for missing columns to guide the user to run SQL
      if (error.message.toLowerCase().includes("column") && error.message.toLowerCase().includes("not found")) {
        const missingColumn = error.message.match(/'([^']+)'/)?.[1] || "Required column";
        throw new Error(`CRITICAL: The column "${missingColumn}" does not exist in your Supabase 'config' table. Please run the SQL script in schema.sql using the Supabase SQL Editor.`);
      }
      throw new Error(`Cloud sync error: ${error.message}`);
    }
  }
};