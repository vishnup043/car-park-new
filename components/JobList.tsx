import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, 
  Car, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  ExternalLink,
  Pencil,
  XCircle,
  History,
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react';
import { db } from '../db';
import { Job, JobStatus, Customer, Vehicle } from '../types';

interface JobListProps {
  searchTerm: string;
  onEditJob: (jobId: string) => void;
  filterCustomerId?: string | null;
  onClearFilter?: () => void;
}

const JobList: React.FC<JobListProps> = ({ searchTerm, onEditJob, filterCustomerId, onClearFilter }) => {
  const [activeFilter, setActiveFilter] = useState<JobStatus | 'All'>('All');
  const [jobs, setJobs] = useState<Job[]>(db.getJobs());
  const customers = db.getCustomers();
  const vehicles = db.getVehicles();

  const filteredJobs = useMemo(() => {
    let list = jobs;
    
    // Filter by specific customer history if provided
    if (filterCustomerId) {
      list = list.filter(j => j.customerId === filterCustomerId);
    }
    
    // Filter by status tab
    if (activeFilter !== 'All') {
      list = list.filter(j => j.status === activeFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(j => {
        const customer = customers.find(c => c.id === j.customerId);
        const vehicle = vehicles.find(v => v.id === j.vehicleId);
        return (
          customer?.name.toLowerCase().includes(term) ||
          customer?.mobile.includes(term) ||
          vehicle?.vehicleNumber.toLowerCase().includes(term)
        );
      });
    }
    
    return list.sort((a, b) => b.dateIn - a.dateIn);
  }, [jobs, activeFilter, searchTerm, customers, vehicles, filterCustomerId]);

  const historyStats = useMemo(() => {
    if (!filterCustomerId) return null;
    const customerJobs = jobs.filter(j => j.customerId === filterCustomerId);
    if (customerJobs.length === 0) return null;

    const totalSpend = customerJobs.reduce((sum, j) => sum + (j.charges || 0), 0);
    const firstVisit = Math.min(...customerJobs.map(j => j.dateIn));
    const uniqueVehicles = new Set(customerJobs.map(j => j.vehicleId)).size;

    return {
      count: customerJobs.length,
      totalSpend,
      firstVisit,
      uniqueVehicles,
      customer: customers.find(c => c.id === filterCustomerId)
    };
  }, [filterCustomerId, jobs, customers]);

  const updateStatus = (jobId: string, newStatus: JobStatus) => {
    const updated = db.updateJobStatus(jobId, newStatus);
    if (updated) {
      setJobs(db.getJobs());
      if (newStatus === JobStatus.COMPLETED) {
        handleWhatsApp(updated);
      }
    }
  };

  const handleWhatsApp = (job: Job) => {
    const customer = customers.find(c => c.id === job.customerId);
    const vehicle = vehicles.find(v => v.id === job.vehicleId);
    if (!customer) return;
    const cleanPhone = customer.mobile.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const message = `Hello ${customer.name}, your vehicle (${vehicle?.vehicleNumber || 'car'}) work has been completed at AutoCare. Please visit our shop to collect it. Thank you!`;
    const whatsappUrl = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Customer Profile Header */}
      {filterCustomerId && historyStats && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-blue-600 p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                  <History size={32} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100/80 mb-0.5">Service Profile</p>
                  <h3 className="text-2xl font-bold">{historyStats.customer?.name}</h3>
                  <p className="text-sm text-blue-50/80">{historyStats.customer?.mobile}</p>
                </div>
              </div>
              <button 
                onClick={onClearFilter}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 border border-white/20 backdrop-blur-sm"
              >
                <XCircle size={18} /> Show All Jobs
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100 border-t border-gray-100 bg-slate-50/30">
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
                <TrendingUp size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Visits</span>
              </div>
              <p className="text-xl font-bold text-gray-800">{historyStats.count}</p>
            </div>
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-600 mb-1">
                <DollarSign size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Spend</span>
              </div>
              <p className="text-xl font-bold text-gray-800">${historyStats.totalSpend.toLocaleString()}</p>
            </div>
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-2 text-amber-600 mb-1">
                <Calendar size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">First Visit</span>
              </div>
              <p className="text-sm font-bold text-gray-800">{new Date(historyStats.firstVisit).toLocaleDateString()}</p>
            </div>
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-2 text-indigo-600 mb-1">
                <Car size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Vehicles</span>
              </div>
              <p className="text-sm font-bold text-gray-800">{historyStats.uniqueVehicles}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['All', ...Object.values(JobStatus)].map(status => (
          <button
            key={status}
            onClick={() => setActiveFilter(status as any)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeFilter === status ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map(job => (
            <JobCard 
              key={job.id} 
              job={job} 
              customer={customers.find(c => c.id === job.customerId)!}
              vehicle={vehicles.find(v => v.id === job.vehicleId)!}
              onStatusUpdate={updateStatus}
              onNotify={handleWhatsApp}
              onEdit={() => onEditJob(job.id)}
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Car size={32} />
            </div>
            <h3 className="text-gray-600 font-bold">No jobs found</h3>
          </div>
        )}
      </div>
    </div>
  );
};

const JobCard: React.FC<{ 
  job: Job; 
  customer: Customer; 
  vehicle: Vehicle; 
  onStatusUpdate: (id: string, s: JobStatus) => void;
  onNotify: (job: Job) => void;
  onEdit: () => void;
}> = ({ job, customer, vehicle, onStatusUpdate, onNotify, onEdit }) => {
  const statusColors = {
    [JobStatus.RECEIVED]: 'bg-blue-50 text-blue-600 border-blue-100',
    [JobStatus.IN_PROGRESS]: 'bg-amber-50 text-amber-600 border-amber-100',
    [JobStatus.COMPLETED]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    [JobStatus.DELIVERED]: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden group">
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${statusColors[job.status]}`}>
              {job.status}
            </span>
            <h4 className="mt-2 text-lg font-bold text-gray-800">{vehicle?.vehicleNumber || 'Unknown'}</h4>
            <p className="text-xs text-gray-500 font-medium">{customer?.name} • {customer?.mobile}</p>
          </div>
          <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
            <Pencil size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Services</p>
            <p className="text-sm text-gray-700 font-medium line-clamp-2">{job.services}</p>
          </div>
          <div className="flex justify-between items-center text-[11px] text-gray-500 font-bold uppercase tracking-wider">
            <span>In: {new Date(job.dateIn).toLocaleDateString()}</span>
            <span className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">${job.charges?.toLocaleString() || '0.00'}</span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
          {job.status !== JobStatus.DELIVERED ? (
            <select 
              value={job.status}
              onChange={(e) => onStatusUpdate(job.id, e.target.value as JobStatus)}
              className="flex-1 bg-gray-100 border-none rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
            >
              <option value={JobStatus.RECEIVED}>Mark Received</option>
              <option value={JobStatus.IN_PROGRESS}>Mark In Progress</option>
              <option value={JobStatus.COMPLETED}>Mark Completed</option>
              <option value={JobStatus.DELIVERED}>Mark Delivered</option>
            </select>
          ) : (
            <div className="flex-1 py-2 text-center text-xs font-bold text-gray-400 bg-gray-50 rounded-xl">Delivered</div>
          )}
          <button 
            onClick={() => onNotify(job)} 
            className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition shadow-sm active:scale-95"
            title="Notify via WhatsApp"
          >
            <MessageSquare size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobList;