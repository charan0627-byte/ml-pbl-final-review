import React, { useState } from 'react';
import { api } from '../api/client';
import { X, Sliders, Play, CheckCircle2 } from 'lucide-react';
import { HazardType, RiskLevel, Alert } from '../types/api';

interface AdminDemoModalProps {
  districts: Array<{ id: string; name: string; state: string }>;
  onClose: () => void;
  onSimulationSuccess: (alert: Alert) => void;
}

export const AdminDemoModal: React.FC<AdminDemoModalProps> = ({
  districts,
  onClose,
  onSimulationSuccess,
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState(districts[0]?.id || 'JK-SRI');
  const [hazard, setHazard] = useState<HazardType>('flood');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('Severe');
  const [probability, setProbability] = useState<number>(0.92);

  const [loading, setLoading] = useState(false);
  const [simulatedAlert, setSimulatedAlert] = useState<Alert | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.triggerDemoEvent(
        {
          district_id: selectedDistrict,
          hazard_type: hazard,
          risk_level: riskLevel,
          probability: probability,
        },
        'dris-super-secret-admin-token'
      );
      setSimulatedAlert(res);
      onSimulationSuccess(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Simulation failed');
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
            <div className="bg-blue-500/20 text-blue-400 p-2.5 rounded-xl border border-blue-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Disaster Event Simulation Engine</h2>
              <p className="text-xs text-slate-400">Inject extreme weather events to test CAP alert generation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 rounded-xl transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 bg-red-500/20 text-red-300 rounded-xl border border-red-500/30 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRunSimulation} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target Indian District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none"
            >
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.state})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Simulated Hazard</label>
              <select
                value={hazard}
                onChange={(e) => setHazard(e.target.value as HazardType)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none capitalize"
              >
                <option value="flood">Flash Flood</option>
                <option value="heatwave">Extreme Heatwave</option>
                <option value="drought">Agricultural Drought</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Severity Threshold</label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none"
              >
                <option value="Severe">Severe (Emergency Warning)</option>
                <option value="High">High Risk</option>
                <option value="Moderate">Moderate Risk</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-slate-300 font-semibold mb-1">
              <span>Event Probability Score:</span>
              <span className="font-bold text-blue-400">{Math.round(probability * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.99"
              step="0.01"
              value={probability}
              onChange={(e) => setProbability(parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2 mt-4 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span>{loading ? 'Executing Simulation...' : 'Trigger Synthetic Disaster Event'}</span>
          </button>
        </form>

        {simulatedAlert && (
          <div className="mt-6 pt-4 border-t border-slate-800 space-y-3 animate-fade-in text-xs">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>CAP Alert Dispatched & Map Updated!</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px]">
              <p className="text-slate-400">
                Alert ID: <span className="text-slate-200">{simulatedAlert.id}</span>
              </p>
              <p className="text-slate-400">
                Target: <span className="text-slate-200">{simulatedAlert.headline}</span>
              </p>
              <p className="text-slate-400">
                CAP Status: <span className="text-emerald-400">Actual (OASIS v1.2)</span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition"
            >
              Return to Live Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
