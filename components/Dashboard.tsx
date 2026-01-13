import React, { useMemo, useState, useRef, useEffect } from 'react';
import { 
  Car, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  CalendarDays,
  ChevronDown,
  Check,
  AlertCircle,
  IndianRupee,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { db } from '../db';
import { JobStatus, AppView } from '../types';

interface DashboardProps {
  onNavigate: (view: AppView) => void;
}

type DateRange = 'today' | 'yesterday' | '7days' | '30days' | '3months' | 'all' | 'custom';

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const jobs = db.getJobs();
  
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getThresholdDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      if (!j.dateIn) return false;
      const jobDate = j.dateIn;

      switch (dateRange) {
        case 'today': return jobDate === todayStr;
        case 'yesterday': return jobDate === yesterdayStr;
        case '7days': return jobDate >= getThresholdDate(7);
        case '30days': return jobDate >= getThresholdDate(30);
        case '3months': return jobDate >= getThresholdDate(90);
        case 'custom': return jobDate >= startDate && jobDate <= endDate;
        case 'all':
        default: return true;
      }
    });
  }, [jobs, dateRange, todayStr, yesterdayStr, startDate, endDate]);

  const stats = useMemo(() => {
    const filtered = filteredJobs;
    const revenue = filtered.reduce((acc, curr) => acc + (curr.charges || 0), 0);
    
    // Overdue logic
    const overdueJobs = jobs.filter(j => 
      j.status !== JobStatus.COMPLETED && 
      j.status !== JobStatus.DELIVERED && 
      j.expectedDeliveryDate < todayStr
    );

    return {
      total: filtered.length,
      wip: filtered.filter(j => j.status === JobStatus.IN_PROGRESS).length,
      completed: filtered.filter(j => j.status === JobStatus.COMPLETED).length,
      delivered: filtered.filter(j => j.status === JobStatus.DELIVERED).length,
      revenue,
      overdueCount: overdueJobs.length,
      overdueList: overdueJobs.slice(0, 5) // Showing up to 5 overdue jobs
    };
  }, [filteredJobs, jobs, todayStr]);

  const recentJobs = useMemo(() => {
    return [...filteredJobs]
      .sort((a, b) => new Date(b.dateIn).getTime() - new Date(a.dateIn).getTime())
      .slice(0, 6);
  }, [filteredJobs]);

  const rangeLabels: Record<DateRange, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    '7days': 'Last 7 Days',
    '30days': 'Last 30 Days',
    '3months': 'Last 3 Months',
    all: 'All Time',
    custom: 'Date Range'
  };

  const currentLabel = dateRange === 'custom' 
    ? `${new Date(startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${new Date(endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
    : rangeLabels[dateRange];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Date Filter Row */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-auto" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all active:scale-95 group w-full sm:w-auto"
            >
              <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <CalendarDays size={18} />
              </div>
              <div className="text-left min-w-[100px]">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Timeline</p>
                <p className="text-sm font-bold text-gray-800 leading-none">{currentLabel}</p>
              </div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ml-2 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-100 rounded-3xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                <div className="p-2">
                  {(Object.keys(rangeLabels) as DateRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => { setDateRange(range); setIsDropdownOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-colors ${
                        dateRange === range ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-600 hover:bg-slate-50'
                      }`}
                    >
                      {rangeLabels[range]}
                      {dateRange === range && <Check size={14} strokeWidth={4} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm animate-in slide-in-from-left-2 w-full sm:w-auto">
              <div className="flex flex-col px-3">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">From</label>
                <input 
                  type="date" 
                  className="bg-transparent text-xs font-bold text-gray-700 outline-none"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="text-gray-300">
                <ArrowRight size={14} />
              </div>
              <div className="flex flex-col px-3">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">To</label>
                <input 
                  type="date" 
                  className="bg-transparent text-xs font-bold text-gray-700 outline-none"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard 
          label={`Intake`} 
          value={stats.total} 
          icon={<Car className="text-blue-600" />} 
          bgColor="bg-blue-50" 
        />
        <StatCard 
          label="In Progress" 
          value={stats.wip} 
          icon={<Clock className="text-amber-600" />} 
          bgColor="bg-amber-50" 
        />
        <StatCard 
          label="Ready" 
          value={stats.completed} 
          icon={<CheckCircle2 className="text-emerald-600" />} 
          bgColor="bg-emerald-50" 
        />
        <StatCard 
          label="Delivered" 
          value={stats.delivered} 
          icon={<AlertCircle className="text-indigo-600" />} 
          bgColor="bg-indigo-50" 
        />
        <StatCard 
          label="Est. Revenue" 
          value={stats.revenue} 
          unit="₹"
          icon={<IndianRupee className="text-slate-600" />} 
          bgColor="bg-slate-100" 
          isCurrency
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Operational Feed */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-gray-800 tracking-tight">Fleet Activity</h2>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Status for {currentLabel}</p>
            </div>
            <button 
              onClick={() => onNavigate('add-job')}
              className="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition shadow-xl shadow-blue-100 uppercase text-[10px] tracking-widest active:scale-95 hidden sm:block"
            >
              Quick Intake
            </button>
          </div>
          
          <div className="space-y-3">
            {recentJobs.length > 0 ? (
              recentJobs.map(job => {
                const isFinished = job.status === JobStatus.COMPLETED || job.status === JobStatus.DELIVERED;
                const isInProgress = job.status === JobStatus.IN_PROGRESS;
                
                return (
                  <div key={job.id} className="flex items-center gap-4 group cursor-pointer p-3 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 border border-transparent hover:border-blue-100 rounded-2xl transition-all duration-300" onClick={() => onNavigate('jobs')}>
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 ${
                      isFinished ? 'bg-green-100 text-green-600 shadow-sm' : 
                      isInProgress ? 'bg-amber-100 text-amber-600 shadow-sm' : 'bg-gray-100 text-gray-400 shadow-sm'
                    }`}>
                      {isFinished ? <CheckCircle2 size={22} /> : <Wrench size={22} />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-black text-gray-800 truncate leading-none">{job.vehicleNumber}</p>
                        <span className="text-[9px] font-black text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded-md uppercase">{job.dateIn}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold truncate uppercase tracking-tight">
                        {job.customerName} • <span className={isFinished ? 'text-green-600' : isInProgress ? 'text-amber-600' : ''}>{job.status}</span>
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-200 group-hover:text-blue-500 transition-colors" />
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Car className="text-slate-200" size={32} />
                 </div>
                 <p className="text-xs text-slate-400 font-black uppercase tracking-widest">No matching operations</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 sm:hidden">
            <button onClick={() => onNavigate('add-job')} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition shadow-xl shadow-blue-100 uppercase text-xs tracking-[0.15em] active:scale-95">
              Create New Job
            </button>
          </div>
        </div>

        {/* Right Sidebar - Attention / Overdue */}
        <div className="space-y-6 lg:h-full">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden relative h-full flex flex-col">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
               <AlertTriangle size={80} />
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                 <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-800 leading-tight">Attention Needed</h3>
                <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">{stats.overdueCount} Overdue Jobs</p>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              {stats.overdueList.length > 0 ? (
                stats.overdueList.map(job => (
                  <div key={job.id} onClick={() => onNavigate('jobs')} className="p-3 bg-red-50/50 border border-red-100 rounded-2xl hover:bg-white hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-black text-gray-800 uppercase">{job.vehicleNumber}</p>
                      <span className="text-[8px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full uppercase">Delay</span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight truncate">{job.services}</p>
                    <div className="flex items-center gap-1 mt-2 text-[9px] font-black text-red-400 uppercase">
                      <Clock size={10} /> {job.expectedDeliveryDate}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center bg-emerald-50/50 rounded-3xl border border-emerald-100 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 mb-3 shadow-sm">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest max-w-[120px] mx-auto">All jobs are on schedule!</p>
                </div>
              )}
              {stats.overdueCount > 5 && (
                <button onClick={() => onNavigate('jobs')} className="w-full text-center py-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
                  View all overdue tasks
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ 
  label: string; 
  value: number; 
  unit?: string; 
  icon: React.ReactNode; 
  bgColor: string; 
  isCurrency?: boolean 
}> = ({ label, value, unit, icon, bgColor, isCurrency }) => (
  <div className="bg-white p-5 rounded-[2.25rem] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 cursor-default group">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-4 rounded-2xl ${bgColor} shadow-sm group-hover:scale-110 transition-transform duration-500`}>{icon}</div>
    </div>
    <div>
      <h3 className="text-2xl font-black text-gray-800 tracking-tight flex items-baseline gap-1">
        {isCurrency && <span className="text-sm text-gray-400">₹</span>}
        {value.toLocaleString()}
        {!isCurrency && unit && <span className="text-xs text-gray-400 font-black">{unit}</span>}
      </h3>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 group-hover:text-blue-600 transition-colors">{label}</p>
    </div>
  </div>
);

export default Dashboard;