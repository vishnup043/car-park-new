
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  Phone, 
  Save, 
  CheckCircle2, 
  Loader2, 
  Link as LinkIcon,
  AlertCircle,
  Lock,
  Copy,
  AlertTriangle,
  Mail,
  Cpu,
  Zap,
  Send,
  ExternalLink
} from 'lucide-react';
import { db, ShopConfig } from '../db';

// Production Mailer SDK Hook
declare const emailjs: any;

const SettingsView: React.FC = () => {
  const config = db.getConfig();
  const [formData, setFormData] = useState<ShopConfig>({
    adminPhone1: config.adminPhone1,
    adminPhone2: config.adminPhone2,
    adminEmail1: config.adminEmail1 || '',
    adminEmail2: config.adminEmail2 || '',
    adminPin: config.adminPin,
    groupInviteLink: config.groupInviteLink,
    recoveryKey: config.recoveryKey,
    emailjsServiceId: config.emailjsServiceId || '',
    emailjsTemplateId: config.emailjsTemplateId || '',
    emailjsPublicKey: config.emailjsPublicKey || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isTestingMail, setIsTestingMail] = useState(false);
  const [testMailResult, setTestMailResult] = useState<{success: boolean, message: React.ReactNode | string} | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);

    try {
      await db.saveConfig(formData);
      setSuccess(true);
      
      if (formData.emailjsPublicKey && typeof emailjs !== 'undefined') {
        emailjs.init(formData.emailjsPublicKey);
      }
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      alert("Failed to save configuration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestEmail = async () => {
    if (!formData.emailjsServiceId || !formData.emailjsTemplateId || !formData.emailjsPublicKey) {
      setTestMailResult({ success: false, message: "Enter Service, Template, and Public keys first." });
      return;
    }

    setIsTestingMail(true);
    setTestMailResult(null);

    try {
      if (typeof emailjs === 'undefined') throw new Error("Mail SDK not found.");
      
      emailjs.init(formData.emailjsPublicKey);

      // Generate mock time for test
      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + 15);
      const timeString = expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      await emailjs.send(
        formData.emailjsServiceId,
        formData.emailjsTemplateId,
        {
          to_email: formData.adminEmail1 || "test@receiver.com",
          newPin: "TEST-0000", // Key updated to match user's template {{newPin}}
          time: timeString,    // Key updated to match user's template {{time}}
          app_name: "New Car Park Connection Test",
          admin_phone: formData.adminPhone1
        }
      );
      setTestMailResult({ success: true, message: "Connection Verified! Check your inbox." });
    } catch (err: any) {
      const errorMsg = err.text || err.message || JSON.stringify(err);
      
      if (errorMsg.includes('insufficient authentication scopes')) {
        setTestMailResult({ 
          success: false, 
          message: (
            <div className="space-y-2">
              <p>Gmail API Error: Insufficient Scopes.</p>
              <p className="text-[9px] font-medium leading-tight">Your EmailJS Gmail service needs re-authorization. Visit your EmailJS dashboard, edit the Gmail service, and re-connect your account.</p>
              <a href="https://www.emailjs.com/docs/faq/gmail-api-insufficient-scopes/" target="_blank" className="flex items-center gap-1 text-red-800 underline font-black uppercase text-[8px]">
                <ExternalLink size={10} /> View Official Fix Guide
              </a>
            </div>
          ) 
        });
      } else {
        setTestMailResult({ success: false, message: `Failed: ${errorMsg}` });
      }
    } finally {
      setIsTestingMail(false);
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(formData.recoveryKey);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="md:text-3xl text-lg font-black text-gray-800 tracking-tight">System Configuration</h2>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Manage secure access and shop integrations</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8 flex flex-col">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-blue-500/5 space-y-6">
            <div className="flex items-center gap-3 text-blue-600 mb-2">
              <ShieldCheck size={24} />
              <h3 className="font-black text-lg tracking-tight uppercase">Admin Security</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Admin Phone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="tel"
                    required
                    value={formData.adminPhone1}
                    onChange={e => setFormData({...formData, adminPhone1: e.target.value})}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all font-bold text-gray-700" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Admin Gmail (Recovery)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="email"
                    required
                    value={formData.adminEmail1}
                    onChange={e => setFormData({...formData, adminEmail1: e.target.value})}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all font-bold text-gray-700" 
                  />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Master Admin PIN</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="text"
                    required
                    value={formData.adminPin}
                    onChange={e => setFormData({...formData, adminPin: e.target.value.replace(/\D/g, '')})}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all font-bold text-gray-700 tracking-widest" 
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle size={20} />
              <h3 className="font-black text-sm uppercase">Recovery Key</h3>
            </div>
            <div className="bg-white/10 p-4 rounded-xl flex items-center justify-between border border-white/10">
              <code className="text-white font-black">{formData.recoveryKey}</code>
              <button type="button" onClick={copyKey} className="text-slate-400 hover:text-white transition">
                {copySuccess ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8 flex flex-col">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-indigo-500/5 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 text-indigo-600">
                <Cpu size={24} />
                <h3 className="font-black text-lg tracking-tight uppercase">Mail Engine</h3>
              </div>
              <button 
                type="button"
                onClick={handleTestEmail}
                disabled={isTestingMail}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-100 transition flex items-center gap-2"
              >
                {isTestingMail ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Test Connection
              </button>
            </div>
            
            {testMailResult && (
              <div className={`px-4 py-3 rounded-xl border text-[10px] font-bold animate-in slide-in-from-top-2 ${testMailResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                {testMailResult.message}
              </div>
            )}

            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
              <div className="flex items-center gap-2 text-blue-700">
                <Zap size={18} />
                <p className="text-[10px] font-black uppercase tracking-widest">EmailJS Integration</p>
              </div>
              <p className="text-[10px] font-bold text-blue-600 leading-relaxed">
                Connect your service at <strong>emailjs.com</strong> and paste the IDs below. Make sure to use Gmail or SMTP.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Service ID</label>
                <input 
                  type="text"
                  value={formData.emailjsServiceId}
                  onChange={e => setFormData({...formData, emailjsServiceId: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-gray-700" 
                  placeholder="service_gmail"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Template ID</label>
                <input 
                  type="text"
                  value={formData.emailjsTemplateId}
                  onChange={e => setFormData({...formData, emailjsTemplateId: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-gray-700" 
                  placeholder="template_otp"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Public Key</label>
                <input 
                  type="text"
                  value={formData.emailjsPublicKey}
                  onChange={e => setFormData({...formData, emailjsPublicKey: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-gray-700" 
                  placeholder="user_xxxx..."
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 uppercase text-xs tracking-[0.2em] ${
              success ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-blue-600 text-white shadow-blue-200'
            }`}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : success ? <CheckCircle2 size={20} /> : <Save size={20} />}
            {isSubmitting ? 'Syncing...' : success ? 'Settings Saved' : 'Commit Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;
