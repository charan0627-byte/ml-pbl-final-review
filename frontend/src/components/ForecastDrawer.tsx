import React from 'react';
import { DistrictForecast } from '../types/api';
import { X, Calendar, CloudRain, Thermometer, Droplets, Waves, ShieldAlert, Sparkles } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ForecastDrawerProps {
  forecast: DistrictForecast | null;
  onClose: () => void;
  onSubscribeForDistrict: (districtId: string) => void;
}

export const ForecastDrawer: React.FC<ForecastDrawerProps> = ({
  forecast,
  onClose,
  onSubscribeForDistrict,
}) => {
  if (!forecast) return null;

  const chartData = forecast.forecast_days.map((day) => ({
    date: day.date.slice(5),
    probability: Math.round(day.probability * 100),
    rainfall: day.rainfall_mm,
    temp: day.temp_max_c,
    humidity: day.humidity_pct,
    river: day.river_level_m || 0,
  }));

  const getBadgeStyle = (level: string) => {
    switch (level) {
      case 'Severe':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'High':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'Moderate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between">
        
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-slate-100">{forecast.district_name}</h2>
                <span className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${getBadgeStyle(forecast.current_risk_level)}`}>
                  {forecast.current_risk_level} Risk ({Math.round(forecast.current_probability * 100)}%)
                </span>
              </div>
              <p className="text-sm text-slate-400 font-medium">
                {forecast.state_name}, India &bull; Hazard: <span className="text-slate-200 capitalize font-semibold">{forecast.hazard_type}</span>
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Recharts Trend Chart */}
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-800 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>7-Day Risk & Weather Projection</span>
              </h3>
              <span className="text-[11px] text-slate-400">Probability & Rainfall (mm)</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="probGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="probability" stroke="#3B82F6" fillOpacity={1} fill="url(#probGrad)" name="Risk Prob %" />
                  <Area type="monotone" dataKey="rainfall" stroke="#10B981" fillOpacity={1} fill="url(#rainGrad)" name="Rainfall mm" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Explainability Drivers */}
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800 mb-6">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              <span>SHAP Multi-Factor Drivers</span>
            </h3>
            <ul className="space-y-2">
              {forecast.top_factors.map((factor, idx) => (
                <li key={idx} className="flex items-start space-x-2.5 text-xs text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 7-Day Cards Breakdown */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Daily Meteorological Breakdown</span>
            </h3>

            <div className="space-y-2.5">
              {forecast.forecast_days.map((day, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-slate-200 min-w-[70px]">{day.date}</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${getBadgeStyle(day.risk_level)}`}>
                      {day.risk_level} ({Math.round(day.probability * 100)}%)
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-slate-300 font-medium">
                    <span className="flex items-center space-x-1" title="Expected Rainfall">
                      <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                      <span>{day.rainfall_mm} mm</span>
                    </span>

                    <span className="flex items-center space-x-1" title="Max Temperature">
                      <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                      <span>{day.temp_max_c}&deg;C</span>
                    </span>

                    <span className="flex items-center space-x-1" title="Humidity">
                      <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{day.humidity_pct}%</span>
                    </span>

                    {day.river_level_m && (
                      <span className="flex items-center space-x-1" title="River Stage">
                        <Waves className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{day.river_level_m}m</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-slate-800 mt-6 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Last Updated: {new Date(forecast.last_updated).toLocaleTimeString()}
          </span>
          <button
            onClick={() => {
              onSubscribeForDistrict(forecast.district_id);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition"
          >
            Subscribe to {forecast.district_name} Alerts
          </button>
        </div>

      </div>
    </div>
  );
};
