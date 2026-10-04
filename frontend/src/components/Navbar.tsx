import React from 'react';
import { ShieldAlert, BellRing, Sliders, BarChart3, CloudRain, Flame, Sun, Layers } from 'lucide-react';
import { HazardType } from '../types/api';

interface NavbarProps {
  currentHazard: HazardType | 'all';
  onSelectHazard: (h: HazardType | 'all') => void;
  activeTab: 'map' | 'alerts' | 'metrics';
  onSelectTab: (tab: 'map' | 'alerts' | 'metrics') => void;
  onOpenSubscribe: () => void;
  onOpenAdmin: () => void;
  alertCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentHazard,
  onSelectHazard,
  activeTab,
  onSelectTab,
  onOpenSubscribe,
  onOpenAdmin,
  alertCount,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white font-bold shadow-md shadow-blue-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-200 bg-clip-text text-transparent">
                DRIS India
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                CAP v1.2 Enabled
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Disaster Risk Intelligence System</p>
          </div>
        </div>

        {/* Hazard Selector Pills */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-medium">
          <button
            onClick={() => onSelectHazard('all')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentHazard === 'all'
                ? 'bg-blue-600 text-white font-semibold shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Hazards</span>
          </button>

          <button
            onClick={() => onSelectHazard('flood')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentHazard === 'flood'
                ? 'bg-blue-600 text-white font-semibold shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 text-blue-400" />
            <span>Flood</span>
          </button>

          <button
            onClick={() => onSelectHazard('heatwave')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentHazard === 'heatwave'
                ? 'bg-orange-600 text-white font-semibold shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Heatwave</span>
          </button>

          <button
            onClick={() => onSelectHazard('drought')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentHazard === 'drought'
                ? 'bg-amber-600 text-white font-semibold shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-yellow-400" />
            <span>Drought</span>
          </button>
        </div>

        {/* View Tabs & Actions */}
        <div className="flex items-center space-x-2">
          {/* Main Navigation Tabs */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
            <button
              onClick={() => onSelectTab('map')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'map'
                  ? 'bg-slate-700 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Risk Map
            </button>
            <button
              onClick={() => onSelectTab('alerts')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'alerts'
                  ? 'bg-slate-700 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Alerts</span>
              {alertCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {alertCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onSelectTab('metrics')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'metrics'
                  ? 'bg-slate-700 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Model Metrics</span>
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={onOpenSubscribe}
            className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Subscribe</span>
          </button>

          <button
            onClick={onOpenAdmin}
            className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl transition"
            title="Simulate Disasters & Test Alerts"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Admin Demo</span>
          </button>
        </div>

      </div>
    </header>
  );
};
