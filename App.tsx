
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
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Key,
  ShieldAlert,
  Settings,
  CheckCircle,
  Mail,
  X,
  Inbox,
  Send,
  ExternalLink
} from 'lucide-react';
import { AppView, Job, Customer, JobStatus } from './types';
import { db, ShopConfig } from './db';
import Dashboard from './components/Dashboard';
import JobList from './components/JobList';
import CustomerList from './components/CustomerList';
import AddJobForm from './components/AddJobForm';
import MarketingView from './components/MarketingView';
import SettingsView from './components/SettingsView';

// Production Mailer SDK Hook
declare const emailjs: any;

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [filterCustomerId, setFilterCustomerId] = useState<string | null>(null);

  const [config, setConfig] = useState<ShopConfig>(db.getConfig());

  // Login inputs
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState<React.ReactNode | string>('');
  const [pinSentSuccess, setPinSentSuccess] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingPin, setIsRequestingPin] = useState(false);
  const [isRequestingEmail, setIsRequestingEmail] = useState(false);

  // Mock fallback if keys are missing
  const [mockEmail, setMockEmail] = useState<{ to: string; pin: string } | null>(null);

  const allowedNumbers = [config.adminPhone1, config.adminPhone2];
  const isAuthorizedNumber = allowedNumbers.includes(loginPhone.trim());
  const hasMailKeys = !!(config.emailjsServiceId && config.emailjsTemplateId && config.emailjsPublicKey);

  // Initialize DB and Mail SDK
  useEffect(() => {
    db.init().then(() => {
      const freshConfig = db.getConfig();
      setConfig(freshConfig);
      setIsDbReady(true);

      if (freshConfig.emailjsPublicKey && typeof emailjs !== 'undefined') {
        emailjs.init(freshConfig.emailjsPublicKey);
      }
    }).catch(err => {
      console.error("DB Init Error:", err);
      setIsDbReady(true);
    });
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');

    setTimeout(() => {
      const currentConfig = db.getConfig();
      if (allowedNumbers.includes(loginPhone.trim()) && loginPin.trim() === currentConfig.adminPin) {
        setIsAuthenticated(true);
      } else {
        setLoginError('Invalid PIN or Unauthorized Access.');
      }
      setIsSubmitting(false);
    }, 600);
  };

  const handleRequestEmailOtp = async () => {
    const trimmedPhone = loginPhone.trim();
    const currentConfig = db.getConfig();

    let targetEmail = "";
    if (trimmedPhone === currentConfig.adminPhone1) targetEmail = currentConfig.adminEmail1;
    if (trimmedPhone === currentConfig.adminPhone2) targetEmail = currentConfig.adminEmail2;

    if (!targetEmail) {
      setLoginError('No recovery email set for this admin number. Add one in Settings.');
      return;
    }

    setIsRequestingEmail(true);
    setLoginError('');
    setEmailSentSuccess(false);

    try {
      const newPinValue = Math.floor(1000 + Math.random() * 9000).toString();
      await db.saveConfig({ ...currentConfig, adminPin: newPinValue });
      setConfig(db.getConfig());

      // Calculate the "valid till" time for the template
      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + 15);
      const timeString = expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (hasMailKeys && typeof emailjs !== 'undefined') {
        try {
          await emailjs.send(
            currentConfig.emailjsServiceId,
            currentConfig.emailjsTemplateId,
            {
              to_email: targetEmail,
              newPin: newPinValue, // Key updated to match user's template {{newPin}}
              time: timeString,    // Key updated to match user's template {{time}}
              app_name: "New Car Park Manager",
              admin_phone: trimmedPhone
            }
          );
          setEmailSentSuccess(true);
          setIsRequestingEmail(false);
          return;
        } catch (mailErr: any) {
          console.error("Mail Dispatch Failed:", mailErr);
          const errorMsg = mailErr.text || mailErr.message || JSON.stringify(mailErr);

          if (errorMsg.includes('insufficient authentication scopes')) {
            setLoginError(
              <div className="flex flex-col gap-2">
                <p>EmailJS Error: Insufficient Gmail Scopes.</p>
                <a href="https://www.emailjs.com/docs/faq/gmail-api-insufficient-scopes/" target="_blank" className="flex items-center gap-1 text-blue-700 underline font-black uppercase text-[9px]">
                  <ExternalLink size={10} /> Fix in EmailJS Dashboard
                </a>
              </div>
            );
          } else {
            setLoginError(`Mail Error: ${errorMsg}`);
          }
          setIsRequestingEmail(false);
          return;
        }
      }

      // Simulation Fallback if keys are empty
      setTimeout(() => {
        setMockEmail({ to: targetEmail, pin: newPinValue });
        setEmailSentSuccess(true);
        setIsRequestingEmail(false);
      }, 1500);

    } catch (err: any) {
      setLoginError(`System Error: ${err.message}`);
      setIsRequestingEmail(false);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentView('dashboard');
    setLoginPhone('');
    setLoginPin('');
    setPinSentSuccess(false);
    setEmailSentSuccess(false);
  };

  if (!isDbReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
           <div className="bg-black p-4 rounded-3xl shadow-xl shadow-blue-200 animate-bounce">
                <img src="/images/logo.jpg" width="130" height="100"></img>
        </div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Initializing Secure Vault...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />

        {mockEmail && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Inbox size={18} className="text-blue-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Simulation Inbox</span>
                </div>
                <button onClick={() => setMockEmail(null)} className="p-1 hover:bg-white/10 rounded-lg transition"><X size={18} /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-2">Subject: Secure Login PIN</p>
                  <p className="text-4xl font-black tracking-[0.2em] text-blue-600">{mockEmail.pin}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-4">Recipient: {mockEmail.to}</p>
                </div>
                <button onClick={() => setMockEmail(null)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest">Close & Login</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-700 relative z-10">
          <div className="text-center mb-10">
            <div className="bg-black w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <img className="rounded-full" src="/images/logo.jpg"></img>
            </div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-none">New Car Park</h1>
            <p className="py-2">Sign in to manage your shop</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {emailSentSuccess && (
              <div className="bg-blue-50 border border-blue-200 px-5 py-4 rounded-2xl text-[11px] font-bold text-blue-800 animate-in slide-in-from-top-2 flex items-center gap-3">
                <Mail className="shrink-0 text-blue-500" size={20} />
                <div>
                  <span>Check your registered Gmail for the PIN.</span>
                </div>
              </div>
            )}

            {loginError && (
              <div className="bg-red-50 border border-red-100 px-5 py-4 rounded-2xl text-[11px] font-bold text-red-600 animate-in slide-in-from-top-2 flex items-center gap-3">
                <AlertCircle className="shrink-0" size={16} /> <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-[13px] font-black text-gray-400 tracking-widest">WhatsApp Number</label>
                  {isAuthorizedNumber && (
                    <button
                      type="button"
                      onClick={handleRequestEmailOtp}
                      disabled={isRequestingEmail}
                      className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      {isRequestingEmail ? <Loader2 size={10} className="animate-spin" /> : <Mail size={10} />}
                      {isRequestingEmail ? 'Sending...' : 'Send PIN to Gmail'}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Smartphone className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isAuthorizedNumber ? 'text-emerald-500' : 'text-gray-300'}`} size={20} />
                  <input
                    type="tel"
                    value={loginPhone}
                    onChange={e => setLoginPhone(e.target.value)}
                    className="w-full pl-12 pr-5 md:py-4 py-2 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 text-sm focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                    placeholder="Enter your whatsApp number "
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-black text-gray-400 tracking-widest mb-2 ml-1">Access PIN</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input
                    type="password"
                    value={loginPin}
                    onChange={e => setLoginPin(e.target.value)}
                    placeholder="****"
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white transition-all font-bold text-gray-700 text-sm tracking-[0.5em]"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isRequestingEmail}
              className="w-full bg-blue-600 text-white font-black py-5 rounded-[1.5rem] transition-all transform active:scale-95 uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-blue-700"
            >
              {isSubmitting ? <><Loader2 className="animate-spin" size={18} /> Verifying...</> : <><ArrowRight size={18} /> Access Dashboard</>}
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
          <div className="bg-blue-600 p-2 rounded-lg"><Car className="text-white" /></div>
          <span className="font-bold text-xl text-gray-800 tracking-tight">New Car Park</span>
        </div>
        <nav className="flex-1 p-4 space-y-1.5">
          <NavButton active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={<LayoutDashboard />} label="Dashboard" />
          <NavButton active={currentView === 'jobs'} onClick={() => setCurrentView('jobs')} icon={<Car />} label="Active Jobs" />
          <NavButton active={currentView === 'customers'} onClick={() => setCurrentView('customers')} icon={<Users />} label="Clients" />
          <NavButton active={currentView === 'marketing'} onClick={() => setCurrentView('marketing')} icon={<Megaphone />} label="Marketing" />
          <NavButton active={currentView === 'add-job'} onClick={() => setCurrentView('add-job')} icon={<PlusCircle />} label="New Service" />
          <NavButton active={currentView === 'settings'} onClick={() => setCurrentView('settings')} icon={<Settings />} label="Settings" />
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition font-bold text-sm">
            <LogOut size={18} /> <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 lg:px-8 flex items-center justify-between">
        <div className="lg:hidden flex items-center gap-2">
          <Car className="text-blue-600 w-6 h-6" /> <span className="font-black text-lg tracking-tight">New Car Park</span>
        </div>
        <div className="hidden lg:block text-2xl font-black text-gray-800 capitalize tracking-tight">
          {editingJobId ? 'Modify Record' : currentView.replace('-', ' ')}
        </div>
        <div className="relative group">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 w-36 sm:w-64 transition-all"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
        </div>
      </header>

      <main className="p-4 lg:p-8 max-w-7xl mx-auto">
        {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
        {currentView === 'jobs' && <JobList searchTerm={searchTerm} onEditJob={(id) => { setEditingJobId(id); setCurrentView('add-job'); }} filterCustomerId={filterCustomerId} onClearFilter={() => setFilterCustomerId(null)} />}
        {currentView === 'customers' && <CustomerList searchTerm={searchTerm} onViewHistory={(id) => { setFilterCustomerId(id); setCurrentView('jobs'); }} />}
        {currentView === 'marketing' && <MarketingView onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'add-job' && <AddJobForm jobId={editingJobId} onSuccess={() => { setEditingJobId(null); setCurrentView('jobs'); }} />}
        {currentView === 'settings' && <SettingsView />}
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 flex items-center justify-between px-2 py-3 pt-8 z-50 shadow-2xl">
        <MobileNavButton active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={<LayoutDashboard size={20} />} label="Home" />
        <MobileNavButton active={currentView === 'jobs'} onClick={() => setCurrentView('jobs')} icon={<Car size={20} />} label="Jobs" />
        <div className="absolute left-0 right-0 flex justify-center -top-12 px-1">
          <button onClick={() => setCurrentView('add-job')} className="bg-blue-600 text-white p-4 rounded-[1.25rem] shadow-2xl shadow-blue-300 ring-8 ring-slate-50 active:scale-90 transition transform"><PlusCircle size={24} /></button>
        </div>
        <MobileNavButton active={currentView === 'customers'} onClick={() => setCurrentView('customers')} icon={<Users />} label="Clients" />
        <MobileNavButton active={currentView === 'marketing'} onClick={() => setCurrentView('marketing')} icon={<Megaphone size={20} />} label="Promo" />
        <MobileNavButton active={currentView === 'settings'} onClick={() => setCurrentView('settings')} icon={<Settings size={20} />} label="Set" />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${active ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-slate-50'}`}>
    {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
    <span className="text-sm">{label}</span>
  </button>
);

const MobileNavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 transition-colors min-w-[50px] ${active ? 'text-blue-600' : 'text-gray-400'}`}>
    {icon} <span className="text-[8px] font-black uppercase tracking-tight">{label}</span>
  </button>
);

export default App;
