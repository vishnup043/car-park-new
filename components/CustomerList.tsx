
import React, { useMemo } from 'react';
import { User, Phone, MapPin, ChevronRight, Search, History } from 'lucide-react';
import { db } from '../db';
import { Customer } from '../types';

interface CustomerListProps {
  searchTerm: string;
  onViewHistory: (customerId: string) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ searchTerm, onViewHistory }) => {
  const customers = db.getCustomers();
  const jobs = db.getJobs();

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.mobile.includes(term)
    );
  }, [customers, searchTerm]);

  const getJobCount = (customerId: string) => {
    return jobs.filter(j => j.customerId === customerId).length;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Customers ({filteredCustomers.length})</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg border border-blue-100">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{customer.name}</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                    <Phone size={12} className="text-blue-400" />
                    {customer.mobile}
                  </span>
                  {customer.address && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                      <MapPin size={12} className="text-blue-400" />
                      {customer.address}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right flex flex-col items-end">
              <div className="bg-blue-50 px-2.5 py-1 rounded-lg text-[10px] font-bold text-blue-600 uppercase border border-blue-100">
                {getJobCount(customer.id)} Services
              </div>
              <button 
                onClick={() => onViewHistory(customer.id)}
                className="mt-3 text-blue-600 hover:text-blue-700 transition flex items-center justify-end gap-1 text-xs font-bold group"
              >
                View History 
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-16 bg-white rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
            <User size={48} className="mb-4 opacity-20" />
            <p className="font-bold text-gray-500">No customers found</p>
            <p className="text-sm">Try searching for a different name or WhatsApp number</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerList;
