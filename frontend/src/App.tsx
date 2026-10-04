import { useState, useEffect } from 'react';
import { api } from './api/client';
import { RiskPrediction, DistrictForecast, Alert, HazardType, District } from './types/api';
import { Navbar } from './components/Navbar';
import { RiskMap } from './components/RiskMap';
import { ForecastDrawer } from './components/ForecastDrawer';
import { AlertsStreamModal } from './components/AlertsStreamModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { ModelMetricsView } from './components/ModelMetricsView';
import { AdminDemoModal } from './components/AdminDemoModal';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export default function App() {
  const [predictions, setPredictions] = useState<RiskPrediction[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [currentHazard, setCurrentHazard] = useState<HazardType | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'map' | 'alerts' | 'metrics'>('map');
  const [loading, setLoading] = useState(true);

  // Selected district for 7-day forecast drawer
  const [selectedForecast, setSelectedForecast] = useState<DistrictForecast | null>(null);
  
  // Modals state
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [subscribeDistrictId, setSubscribeDistrictId] = useState<string>('ALL');
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Fetch risk predictions, districts geojson, and alerts
  const loadData = async () => {
    setLoading(true);
    try {
      const [riskRes, alertsRes, districtsRes] = await Promise.all([
        api.getRisk(currentHazard),
        api.getAlerts(),
        api.getDistricts(),
      ]);
      setPredictions(riskRes);
      setAlerts(alertsRes);
      setDistricts(districtsRes);
    } catch (err) {
      console.error('[DRIS Data Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentHazard]);

  // Handle click on district in Map or Grid
  const handleSelectDistrict = async (districtId: string) => {
    try {
      const hazardToFetch = currentHazard === 'all' ? 'flood' : currentHazard;
      const forecastRes = await api.getDistrictForecast(districtId, hazardToFetch);
      setSelectedForecast(forecastRes);
    } catch (err) {
      console.error('Failed to load forecast for district', districtId, err);
    }
  };

  const districtsList = predictions.map((p) => ({
    id: p.district_id,
    name: p.district_name,
    state: p.state_name,
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Navigation Header */}
      <Navbar
        currentHazard={currentHazard}
        onSelectHazard={(h) => setCurrentHazard(h)}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'alerts') {
            setShowAlertsModal(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenSubscribe={() => {
          setSubscribeDistrictId('ALL');
          setShowSubscribeModal(true);
        }}
        onOpenAdmin={() => setShowAdminModal(true)}
        alertCount={alerts.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Top Operational Status Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">
                DRIS Real-Time Hydrometeorological Risk Monitor
              </p>
              <p className="text-[11px] text-slate-400">
                Monitoring {predictions.length} Indian Districts across Jammu & Kashmir, Ladakh, Assam, Rajasthan, Kerala, Delhi & Peninsular India
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadData}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-xl transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Baseline</span>
            </button>
          </div>
        </div>

        {/* Tab View Switching */}
        {activeTab === 'map' && (
          <RiskMap
            predictions={predictions}
            districts={districts}
            onSelectDistrict={handleSelectDistrict}
          />
        )}

        {activeTab === 'metrics' && <ModelMetricsView />}

      </main>

      {/* Modals & Drawers */}
      {selectedForecast && (
        <ForecastDrawer
          forecast={selectedForecast}
          onClose={() => setSelectedForecast(null)}
          onSubscribeForDistrict={(distId) => {
            setSubscribeDistrictId(distId);
            setShowSubscribeModal(true);
          }}
        />
      )}

      {showAlertsModal && (
        <AlertsStreamModal
          alerts={alerts}
          onClose={() => setShowAlertsModal(false)}
        />
      )}

      {showSubscribeModal && (
        <SubscriptionModal
          initialDistrictId={subscribeDistrictId}
          onClose={() => setShowSubscribeModal(false)}
          onSuccess={() => loadData()}
        />
      )}

      {showAdminModal && (
        <AdminDemoModal
          districts={districtsList}
          onClose={() => setShowAdminModal(false)}
          onSimulationSuccess={() => {
            loadData();
          }}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-slate-300">Disaster Risk Intelligence System (DRIS) &bull; India</span>
          </div>
          <p>&copy; {new Date().getFullYear()} DRIS Project &bull; CAP v1.2 OASIS Standard Compliant Architecture</p>
        </div>
      </footer>

    </div>
  );
}
