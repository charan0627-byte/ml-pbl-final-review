import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ModelMetricsResponse, SingleModelMetric } from '../types/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BarChart3, Sparkles, Cpu, Layers } from 'lucide-react';

export const ModelMetricsView: React.FC = () => {
  const [metricsData, setMetricsData] = useState<ModelMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModelIdx, setSelectedModelIdx] = useState(0);

  useEffect(() => {
    api
      .getModelMetrics()
      .then((res) => setMetricsData(res))
      .catch((err) => console.error('Error fetching model metrics:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
        <Cpu className="w-8 h-8 animate-pulse text-blue-400 mx-auto mb-3" />
        <p className="font-semibold text-sm">Evaluating DRIS Machine Learning Models & SHAP Attribution...</p>
      </div>
    );
  }

  if (!metricsData || metricsData.models.length === 0) {
    return null;
  }

  const currentModel: SingleModelMetric = metricsData.models[selectedModelIdx];

  const shapChartData = currentModel.top_features.map((f) => ({
    featureName: f.feature.length > 25 ? f.feature.slice(0, 24) + '...' : f.feature,
    importance: Math.round(f.importance * 100),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Model Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600/20 text-blue-400 p-2 rounded-xl border border-blue-500/30">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">DRIS ML Model Validation & Explainability</h2>
            <p className="text-xs text-slate-400">Spatiotemporal flood, thermal heatwave, and agricultural drought risk models</p>
          </div>
        </div>

        {/* Model Tabs */}
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-semibold">
          {metricsData.models.map((m, idx) => (
            <button
              key={m.hazard_type}
              onClick={() => setSelectedModelIdx(idx)}
              className={`px-3 py-1.5 rounded-lg transition capitalize ${
                selectedModelIdx === idx
                  ? 'bg-blue-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {m.hazard_type} Engine
            </button>
          ))}
        </div>
      </div>

      {/* Model Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">PR-AUC Score</p>
          <p className="text-2xl font-extrabold text-blue-400">{(currentModel.pr_auc * 100).toFixed(1)}%</p>
          <span className="text-[10px] text-emerald-400 font-medium">Outperforms baseline</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">F1-Score</p>
          <p className="text-2xl font-extrabold text-emerald-400">{(currentModel.f1_score * 100).toFixed(1)}%</p>
          <span className="text-[10px] text-slate-400 font-medium">Harmonic Mean</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Precision</p>
          <p className="text-2xl font-extrabold text-slate-100">{(currentModel.precision * 100).toFixed(1)}%</p>
          <span className="text-[10px] text-slate-400 font-medium">Low False Alarms</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Recall (Sensitivity)</p>
          <p className="text-2xl font-extrabold text-orange-400">{(currentModel.recall * 100).toFixed(1)}%</p>
          <span className="text-[10px] text-slate-400 font-medium">Disaster Detection</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">False Alarm Rate</p>
          <p className="text-2xl font-extrabold text-red-400">{(currentModel.false_alarm_rate * 100).toFixed(1)}%</p>
          <span className="text-[10px] text-slate-400 font-medium">Target &lt; 5.0%</span>
        </div>
      </div>

      {/* Main Charts & Matrix Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SHAP Feature Importance Bar Chart */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-slate-100">SHAP Feature Importance & Attribution Weight</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">{currentModel.model_name}</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shapChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} unit="%" />
                <YAxis dataKey="featureName" type="category" stroke="#94A3B8" fontSize={11} width={170} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar dataKey="importance" fill="#3B82F6" radius={[0, 6, 6, 0]} name="SHAP Importance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2x2 Confusion Matrix & Calibration Status */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <span>2x2 Confusion Matrix Evaluation</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center text-xs">
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl">
                <p className="text-[10px] text-emerald-400 font-semibold uppercase mb-1">True Negatives (TN)</p>
                <p className="text-2xl font-bold text-slate-100">{currentModel.confusion_matrix[0][0]}</p>
                <span className="text-[10px] text-slate-400">Correct Normal</span>
              </div>

              <div className="bg-red-950/40 border border-red-500/30 p-4 rounded-2xl">
                <p className="text-[10px] text-red-400 font-semibold uppercase mb-1">False Positives (FP)</p>
                <p className="text-2xl font-bold text-slate-100">{currentModel.confusion_matrix[0][1]}</p>
                <span className="text-[10px] text-slate-400">False Alarm</span>
              </div>

              <div className="bg-orange-950/40 border border-orange-500/30 p-4 rounded-2xl">
                <p className="text-[10px] text-orange-400 font-semibold uppercase mb-1">False Negatives (FN)</p>
                <p className="text-2xl font-bold text-slate-100">{currentModel.confusion_matrix[1][0]}</p>
                <span className="text-[10px] text-slate-400">Missed Warning</span>
              </div>

              <div className="bg-blue-950/40 border border-blue-500/30 p-4 rounded-2xl">
                <p className="text-[10px] text-blue-400 font-semibold uppercase mb-1">True Positives (TP)</p>
                <p className="text-2xl font-bold text-slate-100">{currentModel.confusion_matrix[1][1]}</p>
                <span className="text-[10px] text-slate-400">Correct Disaster Warning</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Reliability Calibration:</span>
            <span className="text-emerald-400 font-bold">{currentModel.calibration_status}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
