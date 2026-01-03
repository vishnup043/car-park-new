import React, { useMemo } from 'react';
import { User, Phone, MapPin, ChevronRight, Search, History, TrendingUp } from 'lucide-react';
import { db } from '../db';

interface CustomerListProps {
  searchTerm: string;
  onViewHistory: (customerId: string) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ searchTerm, onViewHistory }) => {
  const consolidatedCustomers = db.getCustomers();
  const jobs = db.getJobs();

  const filtered = useMemo(() => {
    let list = consolidatedCustomers;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(term) || 
        c.mobile.includes(term)
      );
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [consolidatedCustomers, searchTerm]);

  const getJobStats = (mobile: string) => {
    const relatedJobs = jobs.filter(j => j.customerMobile === mobile);
    const totalSpend = relatedJobs.reduce((sum, j) => sum + (j.charges || 0), 0);
    return {
      count: relatedJobs.length,
      spend: totalSpend
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Client Database</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Total Unique Contacts: {filtered.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(customer => {
          const stats = getJobStats(customer.mobile);
          return (
            <div key={customer.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 hover:shadow-xl transition-all duration-500">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl border border-blue-100 shadow-inner">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-gray-800 text-lg leading-none mb-1.5">{customer.name}</h3>
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                      <Phone size={14} className="text-blue-500" />
                      {customer.mobile}
                    </span>
                    {customer.address && (
                      <span className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                        <MapPin size={14} className="text-blue-500" />
                        <span className="truncate max-w-[150px] md:max-w-[200px]">{customer.address}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right flex flex-col items-end gap-3">
                <div className="flex flex-col items-end">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-blue-100">
                    <TrendingUp size={10} /> {stats.count} Visits
                  </span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5">
                    ₹{stats.spend.toLocaleString()} Total
                  </span>
                </div>
                <button 
                  onClick={() => onViewHistory(customer.id)}
                  className="px-4 py-2 bg-slate-50 hover:bg-blue-50 text-blue-600 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:border-blue-100 active:scale-95"
                >
                  History 
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-24 bg-white rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <User size={40} className="opacity-20" />
            </div>
            <p className="font-black text-gray-800">No matching clients</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerList;