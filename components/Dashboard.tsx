import React, { useMemo } from 'react';
import { 
  Car, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { db } from '../db';
import { JobStatus, AppView } from '../types';

interface DashboardProps {
  onNavigate: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const jobs = db.getJobs();
  const todayStr = new Date().toISOString().split('T')[0];
  
  const stats = useMemo(() => {
    return {
      today: jobs.filter(j => {
        if (!j.dateIn) return false;
        // Since dateIn is now YYYY-MM-DD, simple comparison works
        return j.dateIn === todayStr;
      }).length,
      wip: jobs.filter(j => j.status === JobStatus.IN_PROGRESS).length,
      completed: jobs.filter(j => j.status === JobStatus.COMPLETED).length,
      pendingDelivery: jobs.filter(j => j.status === JobStatus.COMPLETED).length,
    };
  }, [jobs, todayStr]);

  const chartData = [
    { name: 'Received', value: jobs.filter(j => j.status === JobStatus.RECEIVED).length, color: '#3b82f6' },
    { name: 'In Progress', value: stats.wip, color: '#f59e0b' },
    { name: 'Completed', value: stats.completed, color: '#10b981' },
    { name: 'Delivered', value: jobs.filter(j => j.status === JobStatus.DELIVERED).length, color: '#64748b' },
  ];

  const recentJobs = useMemo(() => {
    return [...jobs]
      .filter(j => j.dateIn && !isNaN(new Date(j.dateIn).getTime()))
      .sort((a, b) => new Date(b.dateIn).getTime() - new Date(a.dateIn).getTime())
      .slice(0, 5);
  }, [jobs]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Today's Vehicles" value={stats.today} icon={<Car className="text-blue-600" />} bgColor="bg-blue-50" trend="+4%" />
        <StatCard label="In Progress" value={stats.wip} icon={<Clock className="text-amber-600" />} bgColor="bg-amber-50" trend="-2%" />
        <StatCard label="Completed Today" value={stats.completed} icon={<CheckCircle2 className="text-emerald-600" />} bgColor="bg-emerald-50" trend="+12%" />
        <StatCard label="Pending Delivery" value={stats.pendingDelivery} icon={<TrendingUp className="text-indigo-600" />} bgColor="bg-indigo-50" trend="0%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">Job Status Overview</h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {recentJobs.length > 0 ? (
              recentJobs.map(job => (
                <div key={job.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => onNavigate('jobs')}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${job.status === JobStatus.COMPLETED ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    {job.status === JobStatus.COMPLETED ? <CheckCircle2 size={18} /> : <Wrench size={18} />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-gray-800 truncate">{job.vehicleNumber}</p>
                    <p className="text-xs text-gray-500 truncate">{job.customerName}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition" />
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
            )}
          </div>
          <button onClick={() => onNavigate('add-job')} className="w-full mt-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200">
            Create New Job
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; bgColor: string; trend: string }> = ({ label, value, icon, bgColor, trend }) => (
  <div className="bg-white p-4 lg:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-2.5 rounded-xl ${bgColor}`}>{icon}</div>
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${trend.startsWith('+') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
        {trend}
      </span>
    </div>
    <div>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  </div>
);

export default Dashboard;