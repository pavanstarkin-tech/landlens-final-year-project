import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { mapboxService } from '../../services/mapbox.service';
import type { Property } from '../../models/property.models';
import { parseBoundaryFromDescription } from '../../utils/boundary';
import { MapPin, Layers, RefreshCw, Trash2, Check, ChevronDown } from 'lucide-react';

export type MapStyleKey = 'streets' | 'satellite' | 'outdoors' | 'light' | 'dark';

export interface MapStyleOption {
  key: MapStyleKey;
  label: string;
  url: string;
  icon: string;
}

export const MAP_STYLES: MapStyleOption[] = [
  { key: 'satellite', label: 'Satellite (Site Lite)', url: 'mapbox://styles/mapbox/satellite-streets-v12', icon: '🛰️' },
  { key: 'streets', label: 'Streets', url: 'mapbox://styles/mapbox/streets-v12', icon: '🗺️' },
  { key: 'outdoors', label: 'Terrain', url: 'mapbox://styles/mapbox/outdoors-v12', icon: '🏔️' },
  { key: 'light', label: 'Light', url: 'mapbox://styles/mapbox/light-v11', icon: '☀️' },
  { key: 'dark', label: 'Dark', url: 'mapbox://styles/mapbox/dark-v11', icon: '🌙' },
];

interface LocationSelectData {
  lat: number;
  lng: number;
  address: string;
  village: string;
  district: string;
  state: string;
  pincode: string;
  area?: number;
  boundary?: [number, number][];
}

interface MapProps {
  onLocationSelected?: (data: LocationSelectData) => void;
  onScheduleVisit?: (property: Property) => void;
  center?: [number, number];
  zoom?: number;
  mode?: 'picker' | 'view' | 'detail';
  properties?: Property[];
  className?: string;
  initialBoundary?: [number, number][];
  pickerLat?: number;
  pickerLng?: number;
}

// Calculate polygon area in acres using Shoelace formula on projected coordinates
const calculatePolygonArea = (coordinates: [number, number][]): number => {
  if (coordinates.length < 3) return 0;

  const R = 6378137; // Earth's radius in meters
  let area = 0;

  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    const p1 = coordinates[i];
    const p2 = coordinates[j];

    const lat1 = (p1[1] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;
    const lng1 = (p1[0] * Math.PI) / 180;
    const lng2 = (p2[0] * Math.PI) / 180;

    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = (Math.abs(area) * R * R) / 2;
  const areaInAcres = area / 4046.86;
  return Number(areaInAcres.toFixed(2));
};

const calculateCentroid = (pts: [number, number][]): [number, number] => {
  if (!pts || pts.length === 0) return [0, 0];
  let sumLng = 0, sumLat = 0;
  pts.forEach(p => { sumLng += p[0]; sumLat += p[1]; });
  return [sumLng / pts.length, sumLat / pts.length];
};

export const Map: React.FC<MapProps> = ({
  onLocationSelected,
  onScheduleVisit,
  center = [80.4365, 16.3067],
  zoom = 10,
  mode = 'picker',
  properties = [],
  className = '',
  initialBoundary,
  pickerLat: propPickerLat,
  pickerLng: propPickerLng
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const pickerMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const boundaryMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const propertyMarkersRef = useRef<mapboxgl.Marker[]>([]);

  const boundaryPointsRef = useRef<[number, number][]>([]);
  const [pointCount, setPointCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [drawMode, setDrawMode] = useState<'pin' | 'draw'>('pin');
  const drawModeRef = useRef<'pin' | 'draw'>(drawMode);

  const [mapStyleKey, setMapStyleKey] = useState<MapStyleKey>('streets');
  const [showStylePicker, setShowStylePicker] = useState<boolean>(false);

  useEffect(() => {
    drawModeRef.current = drawMode;
  }, [drawMode]);

  const onLocationSelectedRef = useRef(onLocationSelected);
  const onScheduleVisitRef = useRef(onScheduleVisit);

  useEffect(() => {
    onLocationSelectedRef.current = onLocationSelected;
    onScheduleVisitRef.current = onScheduleVisit;
  }, [onLocationSelected, onScheduleVisit]);

  const pickerLng = propPickerLng ?? center[0];
  const pickerLat = propPickerLat ?? center[1];

  const handleStyleChange = useCallback((key: MapStyleKey) => {
    const selected = MAP_STYLES.find(s => s.key === key);
    if (!selected || !mapRef.current) return;
    setMapStyleKey(key);
    setShowStylePicker(false);
    setLoading(true);
    mapRef.current.setStyle(selected.url);
  }, []);

  const drawPolygon = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const points = boundaryPointsRef.current;
    if (points.length < 2) {
      if (map.getLayer('boundary-fill')) map.removeLayer('boundary-fill');
      if (map.getSource('boundary-fill-source')) map.removeSource('boundary-fill-source');
      if (map.getLayer('boundary-line')) map.removeLayer('boundary-line');
      if (map.getSource('boundary-line-source')) map.removeSource('boundary-line-source');
      return;
    }

    const lineSourceId = 'boundary-line-source';
    const fillSourceId = 'boundary-fill-source';
    const closedCoords = [...points, points[0]];

    const lineGeoJson = {
      type: 'FeatureCollection' as const,
      features: [{
        type: 'Feature' as const,
        geometry: { type: 'LineString' as const, coordinates: closedCoords },
        properties: {}
      }]
    };

    const fillGeoJson = {
      type: 'FeatureCollection' as const,
      features: [{
        type: 'Feature' as const,
        geometry: { type: 'Polygon' as const, coordinates: [closedCoords] },
        properties: {}
      }]
    };

    try {
      const lineSource = map.getSource(lineSourceId) as mapboxgl.GeoJSONSource;
      if (lineSource) {
        lineSource.setData(lineGeoJson);
      } else {
        map.addSource(lineSourceId, { type: 'geojson', data: lineGeoJson });
        map.addLayer({
          id: 'boundary-line',
          type: 'line',
          source: lineSourceId,
          paint: { 'line-color': '#10b981', 'line-width': 4 }
        });
      }

      if (points.length >= 3) {
        const fillSource = map.getSource(fillSourceId) as mapboxgl.GeoJSONSource;
        if (fillSource) {
          fillSource.setData(fillGeoJson);
        } else {
          map.addSource(fillSourceId, { type: 'geojson', data: fillGeoJson });
          map.addLayer({
            id: 'boundary-fill',
            type: 'fill',
            source: fillSourceId,
            paint: { 'fill-color': '#10b981', 'fill-opacity': 0.22 }
          }, 'boundary-line');
        }
      } else {
        if (map.getLayer('boundary-fill')) map.removeLayer('boundary-fill');
        if (map.getSource(fillSourceId)) map.removeSource(fillSourceId);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleReverseGeocode = useCallback(async (lng: number, lat: number, currentBoundary: [number, number][]) => {
    try {
      const details = await mapboxService.reverseGeocode(lng, lat);
      const calculatedArea = currentBoundary.length >= 3 ? calculatePolygonArea(currentBoundary) : undefined;
      if (onLocationSelectedRef.current) {
        onLocationSelectedRef.current({
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          address: details.address || '',
          village: details.village || '',
          district: details.district || '',
          state: details.state || '',
          pincode: details.pincode || '',
          area: calculatedArea,
          boundary: currentBoundary.length > 0 ? [...currentBoundary] : undefined
        });
      }
    } catch {
      if (onLocationSelectedRef.current) {
        onLocationSelectedRef.current({
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          address: '', village: '', district: '', state: '', pincode: '',
          boundary: currentBoundary.length > 0 ? [...currentBoundary] : undefined
        });
      }
    }
  }, []);

  const addBoundaryMarker = useCallback((lng: number, lat: number, index: number) => {
    const map = mapRef.current;
    if (!map) return;

    const el = document.createElement('div');
    el.className = 'w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-lg cursor-pointer hover:scale-125 transition-transform z-10';
    el.addEventListener('click', (e) => e.stopPropagation());

    const marker = new mapboxgl.Marker({ element: el, draggable: true })
      .setLngLat([lng, lat])
      .addTo(map);

    marker.on('drag', () => {
      const pos = marker.getLngLat();
      boundaryPointsRef.current[index] = [pos.lng, pos.lat];
      drawPolygon();
    });

    marker.on('dragend', () => {
      const centroid = calculateCentroid(boundaryPointsRef.current);
      handleReverseGeocode(centroid[0], centroid[1], boundaryPointsRef.current);
    });

    boundaryMarkersRef.current.push(marker);
    setPointCount(boundaryPointsRef.current.length);
  }, [drawPolygon, handleReverseGeocode]);

  const clearBoundary = useCallback((emitEvent = false) => {
    boundaryPointsRef.current = [];
    setPointCount(0);
    boundaryMarkersRef.current.forEach(m => m.remove());
    boundaryMarkersRef.current = [];

    const map = mapRef.current;
    if (map) {
      if (map.getLayer('boundary-fill')) map.removeLayer('boundary-fill');
      if (map.getSource('boundary-fill-source')) map.removeSource('boundary-fill-source');
      if (map.getLayer('boundary-line')) map.removeLayer('boundary-line');
      if (map.getSource('boundary-line-source')) map.removeSource('boundary-line-source');
    }

    if (emitEvent) {
      const lat = pickerMarkerRef.current ? pickerMarkerRef.current.getLngLat().lat : pickerLat;
      const lng = pickerMarkerRef.current ? pickerMarkerRef.current.getLngLat().lng : pickerLng;
      handleReverseGeocode(lng, lat, []);
    }
  }, [pickerLat, pickerLng, handleReverseGeocode]);

  const loadBoundary = useCallback((boundary: [number, number][]) => {
    clearBoundary();
    if (!boundary || boundary.length === 0) return;

    boundaryPointsRef.current = [...boundary];
    setPointCount(boundary.length);
    boundary.forEach((pt, idx) => addBoundaryMarker(pt[0], pt[1], idx));

    const map = mapRef.current;
    if (map) {
      const cent = calculateCentroid(boundary);
      map.setCenter(cent);
      if (pickerMarkerRef.current) pickerMarkerRef.current.setLngLat(cent);
      drawPolygon();
    }
  }, [clearBoundary, addBoundaryMarker, drawPolygon]);

  // Render ONLY Approved Lands Green Outline
  const renderCategorizedLandPolygons = useCallback((map: mapboxgl.Map, propsList: Property[]) => {
    if (!propsList || propsList.length === 0) return;

    const approvedFeatures: any[] = [];

    propsList.forEach(p => {
      // ONLY draw outline for APPROVED lands!
      if (p.status !== 'APPROVED') return;

      let coords: [number, number][] | null = parseBoundaryFromDescription(p.description || '');
      if (!coords || coords.length < 3) {
        if (p.latitude && p.longitude) {
          const areaSqMeters = (p.area || 1) * 4046.86;
          const r = Math.max(120, Math.sqrt(areaSqMeters / Math.PI));
          const R = 6378137;
          const pts: [number, number][] = [];
          for (let i = 0; i < 6; i++) {
            const angle = (i * 60) * Math.PI / 180;
            const dLat = (r * Math.sin(angle)) / R * 180 / Math.PI;
            const dLng = (r * Math.cos(angle)) / (R * Math.cos(p.latitude * Math.PI / 180)) * 180 / Math.PI;
            pts.push([p.longitude + dLng, p.latitude + dLat]);
          }
          coords = pts;
        }
      }

      if (coords && coords.length > 2) {
        const closed = [...coords, coords[0]];
        approvedFeatures.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [closed] },
          properties: { id: p.id, title: p.title, status: 'APPROVED' }
        });
      }
    });

    // Clean up any old unapproved or overlay layers if present
    try {
      if (map.getLayer('unapproved-polygons-fill')) map.removeLayer('unapproved-polygons-fill');
      if (map.getLayer('unapproved-polygons-line')) map.removeLayer('unapproved-polygons-line');
      if (map.getSource('unapproved-polygons')) map.removeSource('unapproved-polygons');
      if (map.getLayer('overlay-polygons-fill')) map.removeLayer('overlay-polygons-fill');
      if (map.getLayer('overlay-polygons-line')) map.removeLayer('overlay-polygons-line');
      if (map.getSource('overlay-polygons')) map.removeSource('overlay-polygons');
    } catch {}

    // APPROVED LAND LAYER (ONLY APPROVED LANDS GREEN OUTLINE)
    if (map.getSource('approved-polygons')) {
      (map.getSource('approved-polygons') as mapboxgl.GeoJSONSource).setData({ type: 'FeatureCollection', features: approvedFeatures });
    } else {
      map.addSource('approved-polygons', { type: 'geojson', data: { type: 'FeatureCollection', features: approvedFeatures } });
      map.addLayer({
        id: 'approved-polygons-fill', type: 'fill', source: 'approved-polygons',
        paint: { 'fill-color': '#10b981', 'fill-opacity': 0.12 }
      });
      map.addLayer({
        id: 'approved-polygons-line', type: 'line', source: 'approved-polygons',
        paint: { 'line-color': '#047857', 'line-width': 4 } // Bold crisp green outline border
      });
    }
  }, []);

  // Initial mount - run exactly ONCE
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = mapboxService.initializeMap(mapContainer.current, center, zoom);
    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    resizeObserver.observe(mapContainer.current);

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true
    });
    map.addControl(geolocate, 'top-right');

    map.on('style.load', () => {
      setLoading(false);
      map.resize();
      mapboxService.add3DBuildings(map);

      if (mode === 'picker') {
        pickerMarkerRef.current = new mapboxgl.Marker({ color: '#10b981', draggable: true })
          .setLngLat([pickerLng, pickerLat])
          .addTo(map);

        pickerMarkerRef.current.on('dragend', () => {
          const pos = pickerMarkerRef.current!.getLngLat();
          handleReverseGeocode(pos.lng, pos.lat, boundaryPointsRef.current);
        });

        if (initialBoundary && initialBoundary.length > 0) {
          loadBoundary(initialBoundary);
        } else {
          handleReverseGeocode(pickerLng, pickerLat, []);
        }
      } else if (mode === 'detail' && properties.length > 0) {
        const p = properties[0];
        mapboxService.addPropertyMarker(map, p);
        const isApproved = p.status === 'APPROVED';

        const parsed = parseBoundaryFromDescription(p.description || '');
        if (parsed && parsed.length > 0) {
          boundaryPointsRef.current = parsed;
          parsed.forEach((pt) => {
            const el = document.createElement('div');
            el.className = `w-2.5 h-2.5 rounded-full border border-white ${isApproved ? 'bg-emerald-500' : 'bg-amber-500'}`;
            new mapboxgl.Marker({ element: el }).setLngLat(pt).addTo(map);
          });
          drawPolygon();

          const bounds = new mapboxgl.LngLatBounds();
          parsed.forEach(pt => bounds.extend(pt));
          map.fitBounds(bounds, { padding: 140, maxZoom: 15, duration: 1000 });
        } else {
          const areaSqMeters = (p.area || 1) * 4046.86;
          const r = Math.sqrt(areaSqMeters / Math.PI);
          const pts: [number, number][] = [];
          const R = 6378137;
          for (let i = 0; i < 6; i++) {
            const angle = (i * 60) * Math.PI / 180;
            const dLat = (r * Math.sin(angle)) / R * 180 / Math.PI;
            const dLng = (r * Math.cos(angle)) / (R * Math.cos(p.latitude * Math.PI / 180)) * 180 / Math.PI;
            pts.push([p.longitude + dLng, p.latitude + dLat]);
          }
          pts.push(pts[0]);
          map.addSource('fallback-boundary', {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [pts] }, properties: {} }
          });
          map.addLayer({
            id: 'fallback-fill', type: 'fill', source: 'fallback-boundary',
            paint: { 'fill-color': isApproved ? '#10b981' : '#f59e0b', 'fill-opacity': isApproved ? 0 : 0.10 }
          });
          map.addLayer({
            id: 'fallback-line', type: 'line', source: 'fallback-boundary',
            paint: { 'line-color': isApproved ? '#059669' : '#d97706', 'line-width': 3.5 }
          });
          const fbBounds = new mapboxgl.LngLatBounds();
          pts.forEach(pt => fbBounds.extend(pt));
          map.fitBounds(fbBounds, { padding: 140, maxZoom: 15, duration: 1000 });
        }
      } else if (mode === 'view') {
        propertyMarkersRef.current.forEach(m => m.remove());
        propertyMarkersRef.current = properties.map(p => mapboxService.addPropertyMarker(map, p, undefined, (prop) => {
          if (onScheduleVisitRef.current) {
            onScheduleVisitRef.current(prop);
          }
        }));
        renderCategorizedLandPolygons(map, properties);
      }
    });

    map.on('click', (e: any) => {
      if (mode !== 'picker') return;

      if (drawModeRef.current === 'pin') {
        if (pickerMarkerRef.current) {
          pickerMarkerRef.current.setLngLat(e.lngLat);
          handleReverseGeocode(e.lngLat.lng, e.lngLat.lat, boundaryPointsRef.current);
        }
      } else {
        const pt: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        boundaryPointsRef.current = [...boundaryPointsRef.current, pt];
        addBoundaryMarker(pt[0], pt[1], boundaryPointsRef.current.length - 1);
        drawPolygon();

        const cent = calculateCentroid(boundaryPointsRef.current);
        handleReverseGeocode(cent[0], cent[1], boundaryPointsRef.current);
      }
    });

    return () => {
      resizeObserver.disconnect();
      if (pickerMarkerRef.current) pickerMarkerRef.current.remove();
      boundaryMarkersRef.current.forEach(m => m.remove());
      propertyMarkersRef.current.forEach(m => m.remove());
      map.remove();
    };
  }, []);

  // Watch properties updates (in view mode and picker mode)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || (mode !== 'view' && mode !== 'picker')) return;

    const renderExisting = () => {
      if (!properties || properties.length === 0) return;
      propertyMarkersRef.current.forEach(m => m.remove());
      propertyMarkersRef.current = properties.map(p => mapboxService.addPropertyMarker(map, p, undefined, (prop) => {
        if (onScheduleVisitRef.current) {
          onScheduleVisitRef.current(prop);
        }
      }));
      renderCategorizedLandPolygons(map, properties);
    };

    if (map.isStyleLoaded()) {
      renderExisting();
    } else {
      map.once('style.load', renderExisting);
    }
  }, [properties, mode, renderCategorizedLandPolygons]);

  // Handle switching drawMode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (drawMode === 'pin') {
      if (pickerMarkerRef.current) pickerMarkerRef.current.addTo(map);
      boundaryMarkersRef.current.forEach(m => m.remove());
    } else {
      if (pickerMarkerRef.current) pickerMarkerRef.current.remove();
      boundaryMarkersRef.current.forEach(m => m.addTo(map));
    }
  }, [drawMode]);

  return (
    <div className={`relative w-full h-full min-h-[300px] overflow-hidden rounded-2xl ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />

      {loading && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="flex items-center gap-2 text-white bg-slate-900/90 px-4 py-2 rounded-xl text-xs font-bold shadow-lg">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Loading Geospatial Boundary Map...</span>
          </div>
        </div>
      )}

      {/* Map Land Status Color Legend Overlay */}
      {mode === 'view' && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-md text-xs font-bold space-y-1.5 z-40 text-left">
          <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mb-1">Land Status Legend</div>
          <div className="flex items-center gap-2 text-slate-800">
            <span className="w-3.5 h-3.5 rounded-xs bg-emerald-500/20 border-2 border-emerald-600" />
            <span>Approved Land (Green Outline)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-800">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600" />
            <span>Pending / Unapproved Pin</span>
          </div>
        </div>
      )}

      {/* Top-Left Control Overlay Container */}
      <div className="absolute top-4 left-4 z-40 flex flex-col gap-2 max-w-[230px]">
        {mode === 'picker' && (
          <div className="glass-card p-3 flex flex-col gap-2 shadow-2xl border border-gray-200">
            <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Boundary Drawing Tool</span>
            <div className="flex bg-gray-100/50 p-0.5 rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => setDrawMode('pin')}
                className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all text-center flex items-center justify-center gap-1
                  ${drawMode === 'pin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <MapPin className="w-2.5 h-2.5" /> Pin Point
              </button>
              <button
                type="button"
                onClick={() => setDrawMode('draw')}
                className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all text-center flex items-center justify-center gap-1
                  ${drawMode === 'draw' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Draw Area
              </button>
            </div>

            {drawMode === 'draw' && (
              <div className="space-y-2 pt-1 border-t border-gray-200 text-left">
                <p className="text-[9px] text-gray-600 leading-tight">
                  Click map to add boundary points. Drag points to adjust.
                </p>
                {pointCount > 0 && (
                  <div className="flex justify-between items-center text-[9px] text-accent-400 font-semibold">
                    <span>Points Placed:</span>
                    <span>{pointCount}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => clearBoundary(true)}
                  className="w-full py-1.5 bg-danger-500/10 hover:bg-danger-500/20 text-danger-400 font-bold text-[9px] rounded-lg transition border border-danger-500/20 flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-2.5 h-2.5" /> Clear Points
                </button>
              </div>
            )}
          </div>
        )}

        {/* Map Style Switcher Pills & Dropdown */}
        <div className="relative text-left">
          <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-xl flex items-center gap-1 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => handleStyleChange('streets')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                mapStyleKey === 'streets'
                  ? 'bg-slate-900 text-white shadow-sm font-extrabold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>🗺️</span>
              <span>Streets</span>
            </button>
            <button
              type="button"
              onClick={() => handleStyleChange('satellite')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                mapStyleKey === 'satellite'
                  ? 'bg-emerald-600 text-white shadow-sm font-extrabold ring-2 ring-emerald-400/50'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>🛰️</span>
              <span>Satellite</span>
            </button>
            <button
              type="button"
              onClick={() => setShowStylePicker(prev => !prev)}
              className={`p-1 px-1.5 rounded-lg transition-all flex items-center gap-0.5 border ${
                showStylePicker ? 'bg-slate-200 border-slate-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              } text-slate-700`}
              title="More Map Styles"
            >
              <Layers className="w-3.5 h-3.5 text-slate-600" />
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>
          </div>

          {/* Full Map Style Picker Dropdown */}
          {showStylePicker && (
            <div className="absolute top-full left-0 mt-1.5 w-48 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-1">Select Map Style</div>
              {MAP_STYLES.map(style => (
                <button
                  key={style.key}
                  type="button"
                  onClick={() => handleStyleChange(style.key)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-colors ${
                    mapStyleKey === style.key
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{style.icon}</span>
                    <span>{style.label}</span>
                  </div>
                  {mapStyleKey === style.key && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {mode === 'picker' && properties && properties.length > 0 && (
        <div className="absolute bottom-4 right-4 z-40">
          <button
            type="button"
            onClick={() => {
              const map = mapRef.current;
              if (!map || properties.length === 0) return;
              const bounds = new mapboxgl.LngLatBounds();
              properties.forEach(p => {
                if (p.longitude && p.latitude) bounds.extend([p.longitude, p.latitude]);
              });
              map.fitBounds(bounds, { padding: 60, maxZoom: 16, duration: 1000 });
            }}
            className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors shadow-sm border border-blue-200/60"
          >
            Fit All
          </button>
        </div>
      )}
    </div>
  );
};
