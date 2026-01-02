import React, { useState, useMemo, useRef } from 'react';
import { 
  Megaphone, 
  CheckCircle2, 
  Users, 
  Sparkles, 
  Search,
  Zap,
  ArrowLeft,
  CheckSquare,
  Square,
  RotateCcw,
  Link as LinkIcon,
  Download,
  ClipboardList,
  Phone,
  MessageCircle,
  X,
  FastForward
} from 'lucide-react';
import { db } from '../db';

interface MarketingViewProps {
  onBack: () => void;
}

const MarketingView: React.FC<MarketingViewProps> = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [campaignMessage, setCampaignMessage] = useState('Wishing you a Joyous Festival Season! 🎊✨ To celebrate, New Car Park is offering a 15% discount on all car detailing and accessories this week. Visit us today! 🚗💨');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportFeedback, setExportFeedback] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [groupLink, setGroupLink] = useState(db.getConfig().groupInviteLink);
  const [saveFeedback, setSaveFeedback] = useState(false);
  
  const [isBlasting, setIsBlasting] = useState(false);
  const [blastIndex, setBlastIndex] = useState(0);
  const blastingListRef = useRef<any[]>([]);

  const allCustomers = useMemo(() => {
    const all = db.getCustomers();
    const unique = new Map();
    all.forEach(c => {
      if (!unique.has(c.mobile)) {
        unique.set(c.mobile, c);
      }
    });
    return Array.from(unique.values());
  }, []);

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return allCustomers.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.mobile.includes(term)
    );
  }, [allCustomers, searchTerm]);

  const handleVcfExport = () => {
    const selectedList = allCustomers.filter(c => selectedIds.has(c.id));
    if (selectedList.length === 0) return;

    let vcfContent = '';
    selectedList.forEach(c => {
      vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:NCP: ${c.name}\nTEL;TYPE=CELL:${c.mobile}\nEND:VCARD\n`;
    });

    const blob = new Blob([vcfContent], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'New_Car_Park_Contacts.vcf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportFeedback(true);
    setTimeout(() => setExportFeedback(false), 3000);
  };

  const copySelectedNumbers = () => {
    const selectedList = allCustomers.filter(c => selectedIds.has(c.id));
    const numbers = selectedList.map(c => c.mobile.replace(/\D/g, '')).join(', ');
    navigator.clipboard.writeText(numbers);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const startBlast = () => {
    const list = allCustomers.filter(c => selectedIds.has(c.id));
    if (list.length === 0) return;
    blastingListRef.current = list;
    setBlastIndex(0);
    setIsBlasting(true);
  };

  const sendCurrentAndNext = () => {
    const target = blastingListRef.current[blastIndex];
    if (!target) return;

    const cleanPhone = target.mobile.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const whatsappUrl = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(campaignMessage)}`;
    
    window.open(whatsappUrl, '_blank');

    if (blastIndex + 1 < blastingListRef.current.length) {
      setBlastIndex(prev => prev + 1);
    } else {
      setIsBlasting(false);
      alert("Campaign Blast Finished! All tabs are open.");
    }
  };

  const skipCurrent = () => {
    if (blastIndex + 1 < blastingListRef.current.length) {
      setBlastIndex(prev => prev + 1);
    } else {
      setIsBlasting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCustomers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCustomers.map(c => c.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSaveConfig = () => {
    db.saveConfig({ groupInviteLink: groupLink });
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  const progressPercentage = useMemo(() => {
    if (!blastingListRef.current.length) return 0;
    return Math.round((blastIndex / blastingListRef.current.length) * 100);
  }, [blastIndex]);

  return (
    <div className="space-y-6 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 hover:bg-white rounded-2xl transition text-gray-500 border border-gray-100 shadow-sm"><ArrowLeft size={24} /></button>
          <div>
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">Campaign Center</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">WhatsApp Blast & CRM Tools</p>
          </div>
        </div>
        <button 
          onClick={handleVcfExport} 
          disabled={selectedIds.size === 0 || isBlasting} 
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase transition-all active:scale-95 disabled:opacity-30 ${
            exportFeedback ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          {exportFeedback ? <CheckCircle2 size={16} /> : <Download size={16} />}
          <span className="hidden sm:inline">Export VCF</span>
        </button>
      </div>

      {/* Blast Overlay/Modal */}
      {isBlasting && blastingListRef.current[blastIndex] && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="bg-indigo-600 p-8 text-white relative">
              <button onClick={() => setIsBlasting(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition">
                <X size={24} />
              </button>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-black">
                  {(blastingListRef.current[blastIndex].name || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-black">{blastingListRef.current[blastIndex].name || 'Customer'}</h3>
                  <p className="text-indigo-100 font-medium">{blastingListRef.current[blastIndex].mobile}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest opacity-60">
                  <span>Contact {blastIndex + 1} of {blastingListRef.current.length}</span>
                  <span>{progressPercentage}%</span>
                </div>
                <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                </div>
              </div>
            </div>
            <div className="p-8 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Message Preview</p>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">{campaignMessage}</p>
              </div>
              <div className="flex gap-4 sticky bottom-0 bg-white pt-2">
                <button 
                  onClick={skipCurrent}
                  className="flex-1 py-4 px-6 border-2 border-slate-100 text-slate-500 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition"
                >
                  <FastForward size={20} /> Skip
                </button>
                <button 
                  onClick={sendCurrentAndNext}
                  className="flex-[2] py-4 px-6 bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition active:scale-95"
                >
                  <MessageCircle size={22} fill="currentColor" /> Send Message
                </button>
              </div>
              <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Opens a new WhatsApp tab for each send
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-indigo-500/5">
            <div className="flex items-center gap-3 mb-4 text-indigo-600">
              <Megaphone size={22} strokeWidth={3} />
              <h3 className="font-black text-lg uppercase tracking-tight">Campaign Template</h3>
            </div>
            
            <div className="space-y-4">
              <textarea 
                rows={8} 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-5 text-sm text-gray-700 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 outline-none transition resize-none leading-relaxed font-medium" 
                value={campaignMessage} 
                onChange={e => setCampaignMessage(e.target.value)} 
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-indigo-500/5">
            <div className="flex items-center gap-3 mb-4 text-emerald-600">
              <LinkIcon size={22} strokeWidth={3} />
              <h3 className="font-black text-lg uppercase tracking-tight">Updates Group Link</h3>
            </div>
            <input 
              type="text" 
              placeholder="https://chat.whatsapp.com/..." 
              className="w-full bg-emerald-50/30 border border-emerald-100 rounded-2xl px-5 py-4 text-sm text-gray-700 outline-none focus:ring-4 focus:ring-emerald-50 transition" 
              value={groupLink} 
              onChange={e => setGroupLink(e.target.value)} 
            />
            <button onClick={handleSaveConfig} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl transition shadow-lg shadow-emerald-200 active:scale-95 text-xs uppercase tracking-[0.2em]">
              {saveFeedback ? 'Config Updated!' : 'Update Link'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 px-4">
            <div className="flex items-center gap-6">
              <h3 className="font-black text-gray-800 text-2xl tracking-tighter">Contacts ({filteredCustomers.length})</h3>
              <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs font-black uppercase text-indigo-600 hover:text-indigo-700 transition">
                {selectedIds.size === filteredCustomers.length ? <CheckSquare size={20} /> : <Square size={20} />} 
                {selectedIds.size === filteredCustomers.length ? 'Deselect' : 'Select Visible'}
              </button>
            </div>
            <div className="relative w-full sm:w-80 group">
              <Search className="absolute left-5 top-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search by name or number..." 
                className="w-full pl-14 pr-6 py-4 bg-white border-2 border-gray-100 rounded-[1.5rem] text-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 outline-none transition shadow-sm font-medium" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCustomers.map(customer => (
              <div 
                key={customer.id} 
                onClick={() => toggleSelectOne(customer.id)} 
                className={`p-6 rounded-[2.25rem] border-2 transition-all cursor-pointer flex items-center justify-between group ${
                  selectedIds.has(customer.id) ? 'border-indigo-600 bg-indigo-50/50 shadow-xl shadow-indigo-500/5' : 'border-gray-50 bg-white hover:border-indigo-200 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all ${
                    selectedIds.has(customer.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'border-gray-200 bg-white group-hover:border-indigo-300'
                  }`}>
                    {selectedIds.has(customer.id) ? <CheckSquare size={20} strokeWidth={3} /> : <Phone size={18} className="text-gray-300" />}
                  </div>
                  <div>
                    <h4 className="font-black text-gray-800 text-lg leading-none mb-1">{customer.name}</h4>
                    <p className="text-[11px] text-indigo-500 font-black uppercase tracking-[0.15em]">{customer.mobile}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      {selectedIds.size > 0 && !isBlasting && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[94%] max-w-2xl bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-3 md:p-5 flex items-center justify-between shadow-2xl z-[100] animate-in slide-in-from-bottom-10">
          <div className="flex items-center gap-3 md:gap-6 pl-2 md:pl-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 rounded-[1rem] md:rounded-[1.25rem] flex items-center justify-center text-white font-black text-xl md:text-2xl shadow-2xl shadow-indigo-500/40">
              {selectedIds.size}
            </div>
            <div>
              <p className="text-white font-black text-sm md:text-lg tracking-tight leading-none mb-0.5 md:mb-1">Selected</p>
              <p className="text-indigo-400 text-[9px] md:text-[10px] uppercase font-black tracking-widest md:tracking-[0.2em] hidden xs:block">Blast Queue Loaded</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 pr-1 md:pr-2">
            <button 
              onClick={copySelectedNumbers} 
              className="p-3 md:p-4 bg-white/10 hover:bg-white/20 text-white rounded-xl md:rounded-2xl transition active:scale-95" 
            >
              {copyFeedback ? <CheckCircle2 size={24} className="text-emerald-400" /> : <ClipboardList size={24} />}
            </button>
            <button 
              onClick={startBlast} 
              className="flex items-center gap-2 md:gap-3 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 px-5 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider transition shadow-2xl shadow-yellow-500/30 active:scale-95"
            >
              <Zap size={20} fill="currentColor" /> 
              <span>Blast Now</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingView;