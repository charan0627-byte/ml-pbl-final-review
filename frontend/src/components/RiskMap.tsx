import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { RiskPrediction, RiskLevel, District } from '../types/api';
import { AlertTriangle, Flame, CloudRain, Sun, Search, ExternalLink, Layers, RotateCcw } from 'lucide-react';

interface RiskMapProps {
  predictions: RiskPrediction[];
  districts?: District[];
  onSelectDistrict: (districtId: string) => void;
}

const getRiskColor = (level: RiskLevel): string => {
  switch (level) {
    case 'Severe':
      return '#DC2626'; // Red-600
    case 'High':
      return '#EA580C'; // Orange-600
    case 'Moderate':
      return '#EAB308'; // Yellow-500
    case 'Low':
    default:
      return '#10B981'; // Emerald-500
  }
};

const BASEMAPS = {
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
  },
  topo: {
    name: 'Topographic',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN',
  },
};

// Helper component to reset map view
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

export const RiskMap: React.FC<RiskMapProps> = ({
  predictions,
  districts = [],
  onSelectDistrict,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [selectedTile, setSelectedTile] = useState<'osm' | 'satellite' | 'topo'>('osm');
  const [mapCenter, setMapCenter] = useState<[number, number]>([22.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState<number>(5);

  // Map of district_id -> District object containing geojson & lat/lon
  const districtMap = useMemo(() => {
    const map = new Map<string, District>();
    districts.forEach((d) => map.set(d.id, d));
    return map;
  }, [districts]);

  const states = Array.from(new Set(predictions.map((p) => p.state_name))).sort();

  const filteredPredictions = predictions.filter((p) => {
    const matchesSearch =
      p.district_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.state_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = selectedState === 'ALL' || p.state_name === selectedState;
    return matchesSearch && matchesState;
  });

  const severeCount = filteredPredictions.filter((p) => p.risk_level === 'Severe').length;
  const highCount = filteredPredictions.filter((p) => p.risk_level === 'High').length;
  const moderateCount = filteredPredictions.filter((p) => p.risk_level === 'Moderate').length;
  const lowCount = filteredPredictions.filter((p) => p.risk_level === 'Low').length;

  const handleResetMap = () => {
    setMapCenter([22.5937, 78.9629]);
    setMapZoom(5);
    setSearchQuery('');
    setSelectedState('ALL');
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search district or state (e.g., Srinagar, Assam, Jaipur, Wayanad)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All States ({states.length})</option>
            {states.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* View Switcher & Counter Badges */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{severeCount} Severe</span>
            </span>
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <span>{highCount} High</span>
            </span>
          </div>

          <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex text-xs font-medium">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-lg transition ${
                viewMode === 'map' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              GIS Map
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Grid View ({filteredPredictions.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'map' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative h-[620px]">
          {/* Top Control Overlay: Basemap Switcher & Reset */}
          <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-800 shadow-xl flex items-center space-x-2 text-xs">
            <div className="flex items-center space-x-1 text-slate-400 font-semibold px-2">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Basemap:</span>
            </div>
            {(['osm', 'satellite', 'topo'] as const).map((tileKey) => (
              <button
                key={tileKey}
                onClick={() => setSelectedTile(tileKey)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  selectedTile === tileKey
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {BASEMAPS[tileKey].name}
              </button>
            ))}
            <button
              onClick={handleResetMap}
              title="Reset Zoom & Pan to All India"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition ml-2 border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Legend Banner Overlay */}
          <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-xl text-xs space-y-1.5">
            <p className="font-bold text-slate-300 text-[11px] uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Risk Severity</span>
              <span className="text-[10px] text-slate-400 font-normal">({filteredPredictions.length} Total)</span>
            </p>
            <div className="flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#DC2626]"></span>
                <span className="text-slate-200 font-medium">Severe (&ge;85%)</span>
              </div>
              <span className="font-bold text-red-400">{severeCount}</span>
            </div>
            <div className="flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#EA580C]"></span>
                <span className="text-slate-200 font-medium">High (65-84%)</span>
              </div>
              <span className="font-bold text-orange-400">{highCount}</span>
            </div>
            <div className="flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#EAB308]"></span>
                <span className="text-slate-200 font-medium">Moderate (35-64%)</span>
              </div>
              <span className="font-bold text-yellow-400">{moderateCount}</span>
            </div>
            <div className="flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
                <span className="text-slate-200 font-medium">Low (&lt;35%)</span>
              </div>
              <span className="font-bold text-emerald-400">{lowCount}</span>
            </div>
          </div>

          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <MapController center={mapCenter} zoom={mapZoom} />
            <TileLayer
              attribution={BASEMAPS[selectedTile].attribution}
              url={BASEMAPS[selectedTile].url}
            />

            {filteredPredictions.map((pred) => {
              const color = getRiskColor(pred.risk_level);
              const districtObj = districtMap.get(pred.district_id);
              const geojsonFeature = districtObj?.geojson;

              const lat = districtObj?.lat ?? 22.0;
              const lon = districtObj?.lon ?? 78.0;

              return (
                <React.Fragment key={`${pred.district_id}-${pred.hazard_type}`}>
                  {/* Render Polygon from Backend GeoJSON if available */}
                  {geojsonFeature && (
                    <GeoJSON
                      key={`geojson-${pred.district_id}`}
                      data={geojsonFeature}
                      style={{
                        fillColor: color,
                        fillOpacity: pred.risk_level === 'Severe' ? 0.75 : pred.risk_level === 'High' ? 0.65 : 0.5,
                        weight: 2,
                        color: color,
                      }}
                      eventHandlers={{
                        click: () => onSelectDistrict(pred.district_id),
                      }}
                    >
                      <Tooltip sticky direction="top" opacity={0.95}>
                        <div className="p-2.5 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-2xl max-w-xs text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-sm text-slate-100">{pred.district_name}</p>
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: color }}
                            >
                              {pred.risk_level}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px]">{pred.state_name}</p>
                          <div className="flex items-center space-x-2 my-1 text-slate-300">
                            <span className="font-semibold text-slate-100">
                              Probability: {Math.round(pred.probability * 100)}%
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-blue-400 font-semibold uppercase">
                              {pred.hazard_type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 italic">
                            Top Driver: {pred.top_factors[0] || 'Meteorological anomaly'}
                          </p>
                          <p className="text-[10px] text-blue-400 font-semibold mt-1 flex items-center space-x-1">
                            <span>Click to view 7-Day Forecast</span>
                            <span>&rarr;</span>
                          </p>
                        </div>
                      </Tooltip>
                    </GeoJSON>
                  )}

                  {/* Centroid CircleMarker with Pulsing Glow Effect for Severe/High */}
                  <CircleMarker
                    center={[lat, lon]}
                    radius={pred.risk_level === 'Severe' ? 10 : pred.risk_level === 'High' ? 8 : 6}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: 0.9,
                      color: '#ffffff',
                      weight: 1.5,
                    }}
                    eventHandlers={{
                      click: () => onSelectDistrict(pred.district_id),
                    }}
                  >
                    {!geojsonFeature && (
                      <Tooltip sticky direction="top" opacity={0.95}>
                        <div className="p-2.5 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-2xl max-w-xs text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-sm text-slate-100">{pred.district_name}</p>
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: color }}
                            >
                              {pred.risk_level}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px]">{pred.state_name}</p>
                          <div className="flex items-center space-x-2 my-1 text-slate-300">
                            <span className="font-semibold text-slate-100">
                              Probability: {Math.round(pred.probability * 100)}%
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-blue-400 font-semibold uppercase">
                              {pred.hazard_type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 italic">
                            Driver: {pred.top_factors[0] || 'Meteorological anomaly'}
                          </p>
                          <p className="text-[10px] text-blue-400 font-semibold mt-1">
                            Click to view 7-Day Forecast &rarr;
                          </p>
                        </div>
                      </Tooltip>
                    )}
                  </CircleMarker>
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>
      ) : (
        /* District Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPredictions.map((pred) => {
            const color = getRiskColor(pred.risk_level);
            return (
              <div
                key={`${pred.district_id}-${pred.hazard_type}`}
                onClick={() => onSelectDistrict(pred.district_id)}
                className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-4 rounded-2xl shadow-xl transition-all hover:scale-[1.01] cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-slate-100 group-hover:text-blue-400 transition">
                        {pred.district_name}
                      </h3>
                      <p className="text-xs text-slate-400">{pred.state_name}</p>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-xl text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      {pred.risk_level}
                    </span>
                  </div>

                  <div className="space-y-1.5 my-3 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Hazard Type:</span>
                      <span className="font-semibold text-slate-200 capitalize flex items-center space-x-1">
                        {pred.hazard_type === 'flood' && <CloudRain className="w-3.5 h-3.5 text-blue-400" />}
                        {pred.hazard_type === 'heatwave' && <Flame className="w-3.5 h-3.5 text-orange-400" />}
                        {pred.hazard_type === 'drought' && <Sun className="w-3.5 h-3.5 text-amber-400" />}
                        <span>{pred.hazard_type}</span>
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-400">
                      <span>Event Probability:</span>
                      <span className="font-bold text-slate-100">{Math.round(pred.probability * 100)}%</span>
                    </div>

                    {/* Probability Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pred.probability * 100}%`, backgroundColor: color }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                    <p className="font-semibold text-slate-400 text-[10px] uppercase mb-0.5">Top Driver</p>
                    <p className="truncate">{pred.top_factors[0] || 'Hydrometeorological inputs'}</p>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-blue-400 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>View 7-Day Forecast</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
