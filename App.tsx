
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Wrench, 
  Users, 
  PlusCircle, 
  Search, 
  LogOut,
  Car,
  Megaphone,
  Loader2
} from 'lucide-react';
// Fixed: Removed non-existent 'Vehicle' import
import { AppView, Job, Customer, JobStatus } from './types';
import { db } from './db';
import Dashboard from './components/Dashboard';
import JobList from './components/JobList';
import CustomerList from './components/CustomerList';
import AddJobForm from './components/AddJobForm';
import MarketingView from './components/MarketingView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [filterCustomerId, setFilterCustomerId] = useState<string | null>(null);

  // Initialize DB connection
  useEffect(() => {
    db.init().then(() => {
      setIsDbReady(true);
    });
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentView('dashboard');
    setFilterCustomerId(null);
  };

  const handleEditJob = (jobId: string) => {
    setEditingJobId(jobId);
    setCurrentView('add-job');
  };

  const handleAddNew = () => {
    setEditingJobId(null);
    setFilterCustomerId(null);
    setCurrentView('add-job');
  };

  const handleViewHistory = (customerId: string) => {
    setFilterCustomerId(customerId);
    setSearchTerm('');
    setCurrentView('jobs');
  };

  const handleClearFilter = () => {
    setFilterCustomerId(null);
  };

  if (!isDbReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-200 animate-bounce">
          <Wrench className="text-white w-10 h-10" />
        </div>
        <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-xs">
          <Loader2 className="animate-spin" size={16} />
          Connecting to Cloud Database...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 to-indigo-800">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wrench className="text-blue-600 w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">New Car Park Manager</h1>
            <p className="text-gray-500">Sign in to manage your shop</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
              <input type="tel" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="9876543210" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin PIN</label>
              <input type="password" placeholder="****" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" required />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-lg transition transform active:scale-95">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-0 lg:pl-64 transition-all duration-300">
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
          <div className="bg-blue-600 p-2 rounded-lg"><Wrench className="text-white w-6 h-6" /></div>
          <span className="font-bold text-xl text-gray-800">New Car Park</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavButton active={currentView === 'dashboard'} onClick={() => { setCurrentView('dashboard'); setFilterCustomerId(null); }} icon={<LayoutDashboard />} label="Dashboard" />
          <NavButton active={currentView === 'jobs'} onClick={() => setCurrentView('jobs')} icon={<Car />} label="Active Jobs" />
          <NavButton active={currentView === 'customers'} onClick={() => { setCurrentView('customers'); setFilterCustomerId(null); }} icon={<Users />} label="Customers" />
          <NavButton active={currentView === 'marketing'} onClick={() => { setCurrentView('marketing'); setFilterCustomerId(null); }} icon={<Megaphone />} label="Marketing" />
          <NavButton active={currentView === 'add-job'} onClick={handleAddNew} icon={<PlusCircle />} label="New Service" />
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition">
            <LogOut size={20} /> <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 lg:px-8 flex items-center justify-between">
        <div className="lg:hidden flex items-center gap-2">
          <Wrench className="text-blue-600 w-6 h-6" /> <span className="font-bold text-lg">New Car Park</span>
        </div>
        <div className="hidden lg:block text-2xl font-black text-gray-800 capitalize tracking-tight">
          {editingJobId ? 'Modify Record' : currentView.replace('-', ' ')}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Quick Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 w-40 sm:w-64 transition-all"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-8 max-w-7xl mx-auto">
        {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
        {currentView === 'jobs' && <JobList searchTerm={searchTerm} onEditJob={handleEditJob} filterCustomerId={filterCustomerId} onClearFilter={handleClearFilter} />}
        {currentView === 'customers' && <CustomerList searchTerm={searchTerm} onViewHistory={handleViewHistory} />}
        {currentView === 'marketing' && <MarketingView onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'add-job' && <AddJobForm jobId={editingJobId} onSuccess={() => { setEditingJobId(null); setCurrentView('jobs'); }} />}
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 flex items-center justify-around px-2 py-3 z-50 shadow-2xl">
        <MobileNavButton active={currentView === 'dashboard'} onClick={() => { setCurrentView('dashboard'); setFilterCustomerId(null); }} icon={<LayoutDashboard size={22} />} label="Home" />
        <MobileNavButton active={currentView === 'jobs'} onClick={() => setCurrentView('jobs')} icon={<Car size={22} />} label="Jobs" />
        <div className="relative -top-6">
          <button onClick={handleAddNew} className="bg-blue-600 text-white p-4 rounded-[1.5rem] shadow-xl shadow-blue-300 ring-8 ring-slate-50 active:scale-90 transition transform"><PlusCircle size={28} /></button>
        </div>
        <MobileNavButton active={currentView === 'marketing'} onClick={() => { setCurrentView('marketing'); setFilterCustomerId(null); }} icon={<Megaphone size={22} />} label="Promo" />
        <MobileNavButton active={currentView === 'customers'} onClick={() => { setCurrentView('customers'); setFilterCustomerId(null); }} icon={<Users size={22} />} label="Clients" />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${active ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
    {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
    <span>{label}</span>
  </button>
);

const MobileNavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 transition-colors ${active ? 'text-blue-600' : 'text-gray-400'}`}>
    {icon} <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
  </button>
);

export default App;
