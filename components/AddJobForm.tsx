import React, { useState, useEffect } from 'react';
import { 
  User, 
  Car, 
  Wrench, 
  CheckCircle,
  ArrowRight,
  ChevronLeft,
  Users,
  MessageCircle,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { db } from '../db';
import { JobStatus, Job } from '../types';

interface AddJobFormProps {
  jobId?: string | null;
  onSuccess: () => void;
}

const AddJobForm: React.FC<AddJobFormProps> = ({ jobId, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteToGroup, setInviteToGroup] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
    vehicleNumber: '',
    brand: '',
    model: '',
    type: 'Car',
    color: '',
    services: '',
    deliveryDate: '',
    charges: ''
  });

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (jobId) {
      const job = db.getJobs().find(j => j.id === jobId);
      if (job) {
        // Safe conversion for form input
        let deliveryStr = todayStr;
        if (job.expectedDeliveryDate) {
          // Robust parser for potential numeric strings in text column
          const raw = job.expectedDeliveryDate;
          if (!isNaN(raw as any) && !String(raw).includes('-')) {
            const d = new Date(Number(raw));
            if (!isNaN(d.getTime())) deliveryStr = d.toISOString().split('T')[0];
          } else {
            const d = new Date(raw);
            if (!isNaN(d.getTime())) deliveryStr = d.toISOString().split('T')[0];
          }
        }

        setFormData({
          name: job.customerName,
          mobile: job.customerMobile,
          address: job.customerAddress || '',
          vehicleNumber: job.vehicleNumber,
          brand: job.brand,
          model: job.model,
          type: job.type,
          color: job.color || '',
          services: job.services,
          deliveryDate: deliveryStr,
          charges: job.charges?.toString() || ''
        });
      }
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData(prev => ({...prev, deliveryDate: tomorrow.toISOString().split('T')[0]}));
    }
  }, [jobId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const existingJob = jobId ? db.getJobs().find(j => j.id === jobId) : null;
      const jId = jobId || Math.random().toString(36).substr(2, 9);

      const job: Job = {
        id: jId,
        customerName: formData.name,
        customerMobile: formData.mobile,
        customerAddress: formData.address,
        vehicleNumber: formData.vehicleNumber.toUpperCase(),
        brand: formData.brand,
        model: formData.model,
        type: formData.type,
        color: formData.color,
        services: formData.services,
        // dateIn follows same logic: use existing as string or current todayStr
        dateIn: existingJob ? String(existingJob.dateIn) : todayStr,
        expectedDeliveryDate: formData.deliveryDate || todayStr, // Save as string YYYY-MM-DD
        charges: parseFloat(formData.charges) || 0,
        status: existingJob ? existingJob.status : JobStatus.RECEIVED
      };

      await db.saveJob(job);

      if (!jobId) {
        setIsSuccess(true);
      } else {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Submission failed:", error);
      const msg = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
      alert(`Submission Error: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvite = () => {
    const config = db.getConfig();
    const cleanPhone = formData.mobile.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const message = `Welcome ${formData.name}! Thank you for choosing New Car Park. Please join our WhatsApp updates group for the latest offers: ${config.groupInviteLink}`;
    const whatsappUrl = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    onSuccess();
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto py-12 px-6 text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100">
          <CheckCircle size={48} strokeWidth={2.5} />
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-2">Registration Done!</h2>
        <p className="text-gray-500 font-medium mb-10">The job for {formData.vehicleNumber} has been successfully logged.</p>
        
        <div className="space-y-4">
          {inviteToGroup && db.getConfig().groupInviteLink && (
            <button 
              onClick={handleSendInvite}
              className="w-full flex items-center justify-center gap-3 bg-emerald-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition active:scale-95"
            >
              <MessageCircle size={24} fill="currentColor" />
              Send WhatsApp Invite
            </button>
          )}
          <button 
            onClick={onSuccess}
            className="w-full text-gray-500 font-bold py-4 hover:bg-gray-100 rounded-[1.5rem] transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
      <div className="bg-blue-600 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StepCircle num={1} active={step >= 1} done={step > 1} />
          <StepLine active={step >= 2} />
          <StepCircle num={2} active={step >= 2} done={step > 2} />
          <StepLine active={step >= 3} />
          <StepCircle num={3} active={step >= 3} done={step > 3} />
        </div>
        <span className="text-white font-bold text-xs uppercase tracking-widest">
          {jobId ? 'Edit Record' : 'Client Intake'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-2 mb-4 text-blue-600">
              <User size={20} /> <h3 className="font-bold">Customer Profile</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Customer Name" required value={formData.name} onChange={v => setFormData({...formData, name: v})} />
              <Input label="WhatsApp Phone" required type="tel" placeholder="e.g. 9876543210" value={formData.mobile} onChange={v => setFormData({...formData, mobile: v})} />
              <div className="md:col-span-2">
                <Input label="Residential Locality" value={formData.address} onChange={v => setFormData({...formData, address: v})} />
              </div>
            </div>
            <button type="button" onClick={() => setStep(2)} className="w-full mt-6 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition active:scale-95 shadow-lg shadow-blue-100">
              Vehicle Info <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm font-bold mb-2">
              <ChevronLeft size={16} /> Previous
            </button>
            <div className="flex items-center gap-2 mb-4 text-blue-600">
              <Car size={20} /> <h3 className="font-bold">Vehicle Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Plate Number" placeholder="e.g. MH 12 AB 1234" required value={formData.vehicleNumber} onChange={v => setFormData({...formData, vehicleNumber: v})} />
              <Input label="Manufacturer" placeholder="e.g. Maruti" required value={formData.brand} onChange={v => setFormData({...formData, brand: v})} />
              <Input label="Model Name" placeholder="e.g. Swift" required value={formData.model} onChange={v => setFormData({...formData, model: v})} />
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Type</label>
                <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option>Car</option><option>SUV</option><option>Hatchback</option><option>Sedan</option><option>Luxury</option>
                </select>
              </div>
            </div>
            <button type="button" onClick={() => setStep(3)} className="w-full mt-6 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition active:scale-95 shadow-lg shadow-blue-100">
              Job Requirements <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <button type="button" onClick={() => setStep(2)} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm font-bold mb-2">
              <ChevronLeft size={16} /> Previous
            </button>
            <div className="flex items-center gap-2 mb-4 text-blue-600">
              <Wrench size={20} /> <h3 className="font-bold">Service Details</h3>
            </div>
            <div className="space-y-4">
              <textarea rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition resize-none" placeholder="Work description..." value={formData.services} onChange={e => setFormData({...formData, services: e.target.value})} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Estimated Handover" type="date" min={todayStr} required value={formData.deliveryDate} onChange={v => setFormData({...formData, deliveryDate: v})} />
                <Input label="Estimated Charges (₹)" type="number" value={formData.charges} onChange={v => setFormData({...formData, charges: v})} />
              </div>
              {!jobId && db.getConfig().groupInviteLink && (
                <div onClick={() => setInviteToGroup(!inviteToGroup)} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${inviteToGroup ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${inviteToGroup ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Invite to WhatsApp Group</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Show invite button after finishing</p>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative transition-colors ${inviteToGroup ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${inviteToGroup ? 'left-7' : 'left-1'}`} />
                  </div>
                </div>
              )}
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition active:scale-95 shadow-xl shadow-emerald-100 disabled:opacity-50"
            >
              {isSubmitting ? (
                <><Loader2 className="animate-spin" size={20} /> Registering...</>
              ) : (
                jobId ? 'Save Changes' : 'Confirm Registration'
              )}
              {!isSubmitting && <CheckCircle size={20} />}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

const StepCircle: React.FC<{ num: number; active: boolean; done: boolean }> = ({ num, active, done }) => (
  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${done ? 'bg-emerald-500 text-white shadow-md' : active ? 'bg-white text-blue-600 scale-110 shadow-lg' : 'bg-blue-500 text-blue-200'}`}>
    {done ? <CheckCircle size={18} /> : num}
  </div>
);

const StepLine: React.FC<{ active: boolean }> = ({ active }) => (
  <div className={`h-1 w-8 rounded-full transition-colors duration-500 ${active ? 'bg-white' : 'bg-blue-50'}`} />
);

const Input: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean; min?: string; }> = ({ label, value, onChange, type = 'text', placeholder, required, min }) => (
  <div>
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">{label} {required && '*'}</label>
    <input type={type} required={required} min={min} placeholder={placeholder} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition shadow-sm" value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

export default AddJobForm;