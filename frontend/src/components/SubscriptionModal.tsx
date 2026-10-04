import React, { useState } from 'react';
import { api } from '../api/client';
import { X, Bell, Mail, Phone, CheckCircle2 } from 'lucide-react';
import { RiskLevel } from '../types/api';

interface SubscriptionModalProps {
  initialDistrictId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  initialDistrictId = 'ALL',
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [contactType, setContactType] = useState<'email' | 'sms'>('email');
  const [contactVal, setContactVal] = useState('');
  const [districtId] = useState(initialDistrictId);
  const [selectedHazard] = useState<string>('ALL');
  const [minThreshold, setMinThreshold] = useState<RiskLevel>('High');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contactVal) {
      setErrorMsg('Please enter your name and contact details.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await api.subscribe({
        subscriber_name: name,
        contact_type: contactType,
        contact_value: contactVal,
        district_ids: [districtId],
        hazards: [selectedHazard],
        min_threshold: minThreshold,
        language: language,
      });

      setSuccessMsg('Subscription activated successfully! You will receive CAP v1.2 alerts directly.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to activate subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Subscribe for Emergency Alerts</h2>
              <p className="text-xs text-slate-400">Receive real-time multi-hazard warnings via Email/SMS</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 rounded-xl transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {successMsg ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-100">Subscribed Successfully</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 bg-red-500/20 text-red-300 rounded-xl border border-red-500/30">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Subscriber Name</label>
              <input
                type="text"
                placeholder="e.g. Inspector Rajesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Contact Type Switcher */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Notification Channel</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setContactType('email')}
                  className={`flex items-center justify-center space-x-2 py-2 rounded-xl border font-semibold transition ${
                    contactType === 'email'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => setContactType('sms')}
                  className={`flex items-center justify-center space-x-2 py-2 rounded-xl border font-semibold transition ${
                    contactType === 'sms'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  <span>SMS</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {contactType === 'email' ? 'Email Address' : 'Mobile Phone Number (+91)'}
              </label>
              <input
                type={contactType === 'email' ? 'email' : 'tel'}
                placeholder={contactType === 'email' ? 'officer@sdma.gov.in' : '+91 98765 43210'}
                value={contactVal}
                onChange={(e) => setContactVal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Threshold & Language */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Alert Threshold</label>
                <select
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(e.target.value as RiskLevel)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none"
                >
                  <option value="High">High & Severe (&ge;65%)</option>
                  <option value="Severe">Severe Only (&ge;85%)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Preferred Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'hi')}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none"
                >
                  <option value="en">English (en-IN)</option>
                  <option value="hi">Hindi (hi-IN)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition mt-4 disabled:opacity-50"
            >
              {loading ? 'Activating...' : 'Activate Subscription'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
