import React, { useMemo, useState, useRef, useEffect } from 'react';
import { 
  Car, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  ChevronRight,
  CalendarDays,
  ChevronDown,
  Check,
  AlertCircle,
  Calendar as CalendarIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { db } from '../db';
import { JobStatus, AppView } from '../types';

interface DashboardProps {
  onNavigate: (view: AppView) => void;
}

type DateRange = 'today' | 'yesterday' | '7days' | '30days' | '3months' | 'all' | 'custom';

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const jobs = db.getJobs();
  
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })();

  // Close dropdown when clicking outside
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
        case 'today':
          return jobDate === todayStr;
        case 'yesterday':
          return jobDate === yesterdayStr;
        case '7days':
          return jobDate >= getThresholdDate(7);
        case '30days':
          return jobDate >= getThresholdDate(30);
        case '3months':
          return jobDate >= getThresholdDate(90);
        case 'custom':
          return jobDate === customDate;
        case 'all':
        default:
          return true;
      }
    });
  }, [jobs, dateRange, todayStr, yesterdayStr, customDate]);

  const stats = useMemo(() => {
    return {
      total: filteredJobs.length,
      wip: filteredJobs.filter(j => j.status === JobStatus.IN_PROGRESS).length,
      completed: filteredJobs.filter(j => j.status === JobStatus.COMPLETED).length,
      received: filteredJobs.filter(j => j.status === JobStatus.RECEIVED).length,
      delivered: filteredJobs.filter(j => j.status === JobStatus.DELIVERED).length,
    };
  }, [filteredJobs]);

  const chartData = [
    { name: 'Received', value: stats.received, color: '#3b82f6' },
    { name: 'In Progress', value: stats.wip, color: '#f59e0b' },
    { name: 'Completed', value: stats.completed, color: '#10b981' },
    { name: 'Delivered', value: stats.delivered, color: '#64748b' },
  ];

  const recentJobs = useMemo(() => {
    return [...filteredJobs]
      .sort((a, b) => new Date(b.dateIn).getTime() - new Date(a.dateIn).getTime())
      .slice(0, 5);
  }, [filteredJobs]);

  const rangeLabels: Record<DateRange, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    '7days': 'Last 7 Days',
    '30days': 'Last 30 Days',
    '3months': 'Last 3 Months',
    all: 'All Time',
    custom: 'Specific Date'
  };

  const currentLabel = dateRange === 'custom' 
    ? new Date(customDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : rangeLabels[dateRange];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Date Filter Dropdown */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all active:scale-95 group"
            >
              <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600">
                <CalendarDays size={18} />
              </div>
              <div className="text-left min-w-[100px]">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Period</p>
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
                      onClick={() => {
                        setDateRange(range);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-colors ${
                        dateRange === range 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-600 hover:bg-slate-50'
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
            <div className="flex items-center gap-2 animate-in slide-in-from-left-4 duration-300">
              <input 
                type="date" 
                className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-4 focus:ring-blue-50 transition shadow-sm"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
              />
            </div>
          )}
        </div>
        
        <div className="hidden md:flex items-center gap-2 text-gray-400">
          <Clock size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest">Live Updates</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label={`Vehicles (${currentLabel})`} 
          value={stats.total} 
          icon={<Car className="text-blue-600" />} 
          bgColor="bg-blue-50" 
          trend={dateRange === 'today' ? '+4%' : undefined} 
        />
        <StatCard 
          label="In Progress" 
          value={stats.wip} 
          icon={<Clock className="text-amber-600" />} 
          bgColor="bg-amber-50" 
        />
        <StatCard 
          label="Completed" 
          value={stats.completed} 
          icon={<CheckCircle2 className="text-emerald-600" />} 
          bgColor="bg-emerald-50" 
        />
        <StatCard 
          label="Pending Delivery" 
          value={stats.completed} 
          icon={<AlertCircle className="text-indigo-600" />} 
          bgColor="bg-indigo-50" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Job Status Overview</h2>
              <p className="text-xs text-gray-400 font-medium">Distribution for {currentLabel}</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">Activity List</h2>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase">{currentLabel}</span>
          </div>
          <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
            {recentJobs.length > 0 ? (
              recentJobs.map(job => (
                <div key={job.id} className="flex items-center gap-4 group cursor-pointer p-2 hover:bg-slate-50 rounded-xl transition-all" onClick={() => onNavigate('jobs')}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    job.status === JobStatus.COMPLETED ? 'bg-green-100 text-green-600' : 
                    job.status === JobStatus.IN_PROGRESS ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {job.status === JobStatus.COMPLETED ? <CheckCircle2 size={18} /> : <Wrench size={18} />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-black text-gray-800 truncate leading-none mb-1">{job.vehicleNumber}</p>
                    <p className="text-[10px] text-gray-400 font-bold truncate uppercase tracking-tight">{job.customerName} • {job.status}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 transition" />
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Clock className="text-gray-200" size={24} />
                </div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No jobs found for this period</p>
              </div>
            )}
          </div>
          <button onClick={() => onNavigate('add-job')} className="w-full mt-6 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition shadow-xl shadow-blue-100 uppercase text-xs tracking-[0.15em] active:scale-95">
            Create New Job
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; unit?: string; icon: React.ReactNode; bgColor: string; trend?: string }> = ({ label, value, unit, icon, bgColor, trend }) => (
  <div className="bg-white p-4 lg:p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-2xl ${bgColor} shadow-sm`}>{icon}</div>
      {trend && (
        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${trend.startsWith('+') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <h3 className="text-2xl font-black text-gray-800 tracking-tight">
        {value.toLocaleString()}{unit}
      </h3>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mt-1 leading-tight">{label}</p>
    </div>
  </div>
);

export default Dashboard;