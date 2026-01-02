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
  History as HistoryIcon,
  TrendingUp,
  Calendar,
  DollarSign,
  MapPin,
  Tag
} from 'lucide-react';
import { db } from '../db';
import { Job, JobStatus, Customer } from '../types';

interface JobListProps {
  searchTerm: string;
  onEditJob: (jobId: string) => void;
  filterCustomerId?: string | null;
  onClearFilter?: () => void;
}

const JobList: React.FC<JobListProps> = ({ searchTerm, onEditJob, filterCustomerId, onClearFilter }) => {
  const [activeFilter, setActiveFilter] = useState<JobStatus | 'All'>('All');
  const [jobs, setJobs] = useState<Job[]>(db.getJobs());

  const filteredJobs = useMemo(() => {
    let list = [...jobs];
    
    // Filter by specific customer history if provided
    if (filterCustomerId) {
      const refJob = jobs.find(j => j.id === filterCustomerId);
      if (refJob) {
        list = list.filter(j => j.customerMobile === refJob.customerMobile);
      }
    }
    
    // Filter by status tab (Only if not in History view)
    if (!filterCustomerId && activeFilter !== 'All') {
      list = list.filter(j => j.status === activeFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(j => 
        (j.customerName || '').toLowerCase().includes(term) ||
        (j.customerMobile || '').includes(term) ||
        (j.vehicleNumber || '').toLowerCase().includes(term)
      );
    }
    
    // Newest first by default
    // Safe Sort: Handles both string and numeric date types
    return list.sort((a, b) => new Date(b.dateIn).getTime() - new Date(a.dateIn).getTime());
  }, [jobs, activeFilter, searchTerm, filterCustomerId]);

  const historyStats = useMemo(() => {
    if (!filterCustomerId || filteredJobs.length === 0) return null;
    
    // Safe Sort: Handles both string and numeric date types
    const customerJobs = [...filteredJobs].sort((a, b) => new Date(a.dateIn).getTime() - new Date(b.dateIn).getTime());
    const totalSpend = customerJobs.reduce((sum, j) => sum + (j.charges || 0), 0);
    const uniqueVehicles = new Set(customerJobs.map(j => j.vehicleNumber)).size;

    return {
      count: customerJobs.length,
      totalSpend,
      firstVisit: customerJobs[0].dateIn,
      uniqueVehicles,
      customer: {
        name: customerJobs[0].customerName,
        mobile: customerJobs[0].customerMobile,
        address: customerJobs[0].customerAddress
      }
    };
  }, [filterCustomerId, filteredJobs]);

  const updateStatus = async (jobId: string, newStatus: JobStatus) => {
    try {
      const updated = await db.updateJobStatus(jobId, newStatus);
      if (updated) {
        setJobs(db.getJobs());
        if (newStatus === JobStatus.COMPLETED) {
          handleWhatsApp(updated);
        }
      }
    } catch (error: any) {
      alert(`Status update failed: ${error.message}`);
    }
  };

  const handleWhatsApp = (job: Job) => {
    const cleanPhone = job.customerMobile.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const message = `Hello ${job.customerName}, your vehicle (${job.vehicleNumber}) work has been completed at New Car Park. Please visit our shop to collect it. Thank you!`;
    const whatsappUrl = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getVisitNumber = (jobId: string) => {
    if (!filterCustomerId) return null;
    // Safe Sort: Handles both string and numeric date types
    const customerJobs = [...filteredJobs].sort((a, b) => new Date(a.dateIn).getTime() - new Date(b.dateIn).getTime());
    const index = customerJobs.findIndex(j => j.id === jobId);
    return index !== -1 ? index + 1 : null;
  };

  return (
    <div className="space-y-6">
      {filterCustomerId && historyStats && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-blue-500/5 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-white relative">
             <div className="absolute top-[-20%] right-[-5%] opacity-10 pointer-events-none">
              <HistoryIcon size={200} />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 rounded-[1.75rem] backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-2xl">
                  <span className="text-3xl font-black">{historyStats.customer.name.charAt(0)}</span>
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 bg-blue-400/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 mb-2">
                    <Tag size={12} /> Service History
                  </div>
                  <h3 className="text-3xl font-black tracking-tight">{historyStats.customer.name}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-blue-100/70 font-bold text-sm">
                    <span className="flex items-center gap-1.5"><MessageSquare size={14} /> {historyStats.customer.mobile}</span>
                    {historyStats.customer.address && <span className="flex items-center gap-1.5"><MapPin size={14} /> {historyStats.customer.address}</span>}
                  </div>
                </div>
              </div>
              <button 
                onClick={onClearFilter}
                className="self-start md:self-center px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 border border-white/20 backdrop-blur-md active:scale-95"
              >
                <XCircle size={18} /> Close History
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100 border-t border-gray-100 bg-white">
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
                <TrendingUp size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Visits</span>
              </div>
              <p className="text-3xl font-black text-gray-800">{historyStats.count}</p>
            </div>
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-600 mb-1">
                <DollarSign size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Spend</span>
              </div>
              <p className="text-3xl font-black text-gray-800">${historyStats.totalSpend.toLocaleString()}</p>
            </div>
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-amber-600 mb-1">
                <Calendar size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">First Visit</span>
              </div>
              <p className="text-sm font-black text-gray-800">{new Date(historyStats.firstVisit).toLocaleDateString()}</p>
            </div>
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-indigo-600 mb-1">
                <Car size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Vehicles</span>
              </div>
              <p className="text-sm font-black text-gray-800">{historyStats.uniqueVehicles} Known</p>
            </div>
          </div>
        </div>
      )}

      {!filterCustomerId && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', ...Object.values(JobStatus)].map(status => (
            <button
              key={status}
              onClick={() => setActiveFilter(status as any)}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                activeFilter === status ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-white text-gray-500 border border-gray-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      )}

      <div className={`grid grid-cols-1 ${filterCustomerId ? 'gap-6' : 'md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <div key={job.id} className={filterCustomerId ? "relative pl-8 md:pl-12" : ""}>
              {filterCustomerId && (
                <>
                  <div className="absolute left-4 md:left-6 top-0 bottom-0 w-1 bg-gray-100 rounded-full" />
                  <div className={`absolute left-2 md:left-4 top-10 w-5 h-5 rounded-full border-4 border-white shadow-md z-10 ${
                    job.status === JobStatus.DELIVERED ? 'bg-slate-400' : 'bg-blue-500'
                  }`} />
                </>
              )}
              <JobCard 
                job={job} 
                onStatusUpdate={updateStatus}
                onNotify={handleWhatsApp}
                onEdit={() => onEditJob(job.id)}
                visitNumber={getVisitNumber(job.id)}
                isHistoryView={!!filterCustomerId}
              />
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
            <div className="bg-gray-100 w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Car size={40} />
            </div>
            <h3 className="text-gray-400 font-black text-xl">No service records found</h3>
          </div>
        )}
      </div>
    </div>
  );
};

const JobCard: React.FC<{ 
  job: Job; 
  onStatusUpdate: (id: string, s: JobStatus) => void;
  onNotify: (job: Job) => void;
  onEdit: () => void;
  visitNumber?: number | null;
  isHistoryView?: boolean;
}> = ({ job, onStatusUpdate, onNotify, onEdit, visitNumber, isHistoryView }) => {
  const statusColors = {
    [JobStatus.RECEIVED]: 'bg-blue-50 text-blue-600 border-blue-100',
    [JobStatus.IN_PROGRESS]: 'bg-amber-50 text-amber-600 border-amber-100',
    [JobStatus.COMPLETED]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    [JobStatus.DELIVERED]: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className={`bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group ${isHistoryView ? 'max-w-3xl border-l-4 border-l-blue-500' : ''}`}>
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${statusColors[job.status]}`}>
                {job.status}
              </span>
              {visitNumber && (
                <span className="bg-slate-900 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  Visit #{visitNumber}
                </span>
              )}
            </div>
            <h4 className="mt-3 text-xl font-black text-gray-800 tracking-tight leading-none">{job.vehicleNumber}</h4>
            <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">
              {job.brand} {job.model} • <span className="text-blue-600">{job.customerName}</span>
            </p>
          </div>
          <div className="flex gap-1">
            <button onClick={onEdit} className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-colors">
              <Pencil size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-blue-100 transition-colors">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Job Services</p>
            <p className="text-sm text-slate-700 font-medium leading-relaxed">{job.services}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
               <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Check-in Date</p>
               <p className="text-xs font-bold text-gray-700">{new Date(job.dateIn).toLocaleDateString()}</p>
            </div>
            <div className="bg-emerald-50/30 p-3 rounded-xl border border-emerald-100">
               <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mb-0.5">Bill Amount</p>
               <p className="text-xs font-black text-emerald-700">${job.charges?.toLocaleString() || '0.00'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between gap-3">
          {job.status !== JobStatus.DELIVERED ? (
            <div className="flex-1 relative group/select">
              <select 
                value={job.status}
                onChange={(e) => onStatusUpdate(job.id, e.target.value as JobStatus)}
                className="w-full bg-slate-100 border-none rounded-2xl px-5 py-3 text-xs font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 transition cursor-pointer appearance-none uppercase tracking-widest"
              >
                <option value={JobStatus.RECEIVED}>Received</option>
                <option value={JobStatus.IN_PROGRESS}>Work Started</option>
                <option value={JobStatus.COMPLETED}>Ready / Completed</option>
                <option value={JobStatus.DELIVERED}>Delivered to Owner</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronRight size={16} className="rotate-90" />
              </div>
            </div>
          ) : (
            <div className="flex-1 py-3 text-center text-[10px] font-black text-slate-400 bg-slate-50 rounded-2xl uppercase tracking-widest border border-slate-100">Successfully Delivered</div>
          )}
          
          <button 
            onClick={() => onNotify(job)} 
            className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-90"
            title="Send WhatsApp Update"
          >
            <MessageSquare size={20} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobList;