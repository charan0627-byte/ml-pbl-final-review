import React, { useState } from 'react';
import { Alert } from '../types/api';
import { X, ShieldAlert, FileCode, CheckCircle2, Download, Languages, Copy, Check } from 'lucide-react';

interface AlertsStreamModalProps {
  alerts: Alert[];
  onClose: () => void;
}

export const AlertsStreamModal: React.FC<AlertsStreamModalProps> = ({ alerts, onClose }) => {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(alerts[0] || null);
  const [showXml, setShowXml] = useState(false);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [copied, setCopied] = useState(false);

  const handleCopyXml = () => {
    if (selectedAlert) {
      navigator.clipboard.writeText(selectedAlert.cap_xml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadCap = () => {
    if (!selectedAlert) return;
    const blob = new Blob([selectedAlert.cap_xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedAlert.id}_CAP_v1.2.xml`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-800/80 border-b border-slate-700/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-red-500/20 text-red-400 p-2 rounded-xl border border-red-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <span>DRIS CAP v1.2 Disaster Alert Stream</span>
                <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-extrabold border border-red-500/30">
                  {alerts.length} Active Alerts
                </span>
              </h2>
              <p className="text-xs text-slate-400">OASIS Common Alerting Protocol compliant multi-lingual warning system</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-200 rounded-xl transition"
            >
              <Languages className="w-3.5 h-3.5 text-blue-400" />
              <span>{lang === 'en' ? 'Hindi (हिंदी)' : 'English'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {alerts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
            <h3 className="text-lg font-bold text-slate-200">No Active Disaster Alerts</h3>
            <p className="text-sm text-slate-400 max-w-sm mt-1">
              All monitored Indian districts are currently within normal baseline meteorological safety limits.
            </p>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
            
            {/* Left Column: Alert List */}
            <div className="lg:col-span-5 overflow-y-auto p-4 space-y-3 bg-slate-900/50">
              {alerts.map((alert) => {
                const isSelected = selectedAlert?.id === alert.id;
                return (
                  <div
                    key={alert.id}
                    onClick={() => {
                      setSelectedAlert(alert);
                      setShowXml(false);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/60 shadow-lg'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-mono text-slate-400 font-semibold">{alert.id}</span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          alert.risk_level === 'Severe'
                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                            : 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                        }`}
                      >
                        {alert.risk_level} Risk ({Math.round(alert.probability * 100)}%)
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-100 line-clamp-2 mb-1">{alert.headline}</h4>
                    <p className="text-[11px] text-slate-400">
                      {alert.district_name || alert.district_id} &bull; <span className="capitalize">{alert.hazard_type}</span>
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Alert Details & CAP XML Viewer */}
            <div className="lg:col-span-7 overflow-y-auto p-6 flex flex-col justify-between bg-slate-900">
              {selectedAlert && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs text-blue-400 font-mono font-bold">{selectedAlert.id}</span>
                      <h3 className="text-xl font-bold text-slate-100 mt-0.5">{selectedAlert.headline}</h3>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowXml(!showXml)}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          showXml
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>{showXml ? 'View Formatted' : 'View CAP XML'}</span>
                      </button>
                    </div>
                  </div>

                  {showXml ? (
                    /* CAP XML Code Block */
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto relative">
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-slate-400 text-[11px]">
                        <span>OASIS CAP v1.2 Document</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={handleCopyXml}
                            className="flex items-center space-x-1 hover:text-slate-200 transition"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? 'Copied' : 'Copy'}</span>
                          </button>
                          <button
                            onClick={handleDownloadCap}
                            className="flex items-center space-x-1 hover:text-slate-200 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download .xml</span>
                          </button>
                        </div>
                      </div>
                      <pre className="whitespace-pre-wrap">{selectedAlert.cap_xml}</pre>
                    </div>
                  ) : (
                    /* Formatted CAP Warning */
                    <div className="space-y-6">
                      <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-800">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                          Emergency Broadcast ({lang === 'en' ? 'English' : 'हिंदी'})
                        </h4>
                        <p className="text-sm text-slate-200 leading-relaxed">
                          {lang === 'en' ? selectedAlert.message_en : selectedAlert.message_hi}
                        </p>
                      </div>

                      {/* Safety Actions */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
                          <ShieldAlert className="w-4 h-4 text-emerald-400" />
                          <span>Actionable Emergency Guidance</span>
                        </h4>
                        <ul className="space-y-2">
                          {selectedAlert.safety_actions.map((act, idx) => (
                            <li key={idx} className="flex items-start space-x-2.5 bg-slate-800/40 p-3 rounded-xl border border-slate-800 text-xs text-slate-200">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedAlert && (
                <div className="pt-4 border-t border-slate-800 mt-6 flex items-center justify-between text-xs text-slate-400">
                  <span>Issued by: {selectedAlert.source}</span>
                  <span>Sent: {new Date(selectedAlert.created_at).toLocaleString()}</span>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
