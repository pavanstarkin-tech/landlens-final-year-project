import axios from 'axios';
import mapboxgl from 'mapbox-gl';
import type { Property } from '../models/property.models';

const getMapboxConfig = () => ({
  accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '',
  style: import.meta.env.VITE_MAPBOX_STYLE || 'mapbox://styles/mapbox/streets-v12'
});

class ThreeDControl {
  private _map: mapboxgl.Map | undefined;
  private _container: HTMLDivElement | undefined;
  private _btn: HTMLButtonElement | undefined;
  private _updateText: () => void = () => {};

  onAdd(map: mapboxgl.Map) {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
    
    this._btn = document.createElement('button');
    this._btn.type = 'button';
    this._btn.textContent = '3D';
    this._btn.style.fontWeight = 'bold';
    this._btn.style.fontSize = '11px';
    this._btn.style.width = '29px';
    this._btn.style.height = '29px';
    this._btn.style.fontFamily = 'inherit';
    this._btn.title = 'Toggle 3D View';
    
    this._updateText = () => {
      if (this._btn && this._map) {
        this._btn.textContent = this._map.getPitch() > 0 ? '2D' : '3D';
      }
    };
    
    map.on('pitchend', this._updateText);

    this._btn.onclick = () => {
      if (!this._map) return;
      const is3D = this._map.getPitch() > 0;
      if (!is3D) {
        mapboxService.add3DBuildings(this._map);
      }
      const currentZoom = this._map.getZoom();
      const targetZoom = !is3D && currentZoom < 14.5 ? 15.5 : currentZoom;
      this._map.easeTo({
        pitch: is3D ? 0 : 60,
        bearing: is3D ? 0 : -17.6,
        zoom: targetZoom,
        duration: 1000
      });
    };

    this._container.appendChild(this._btn);
    return this._container;
  }

  onRemove() {
    if (this._map) {
      this._map.off('pitchend', this._updateText);
    }
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    this._map = undefined;
  }
}

export const mapboxService = {
  initializeMap: (container: string | HTMLElement, center: [number, number] = [80.4365, 16.3067], zoom = 10): mapboxgl.Map => {
    const config = getMapboxConfig();
    mapboxgl.accessToken = config.accessToken;
    
    const mapInstance = new mapboxgl.Map({
      container,
      style: config.style,
      center,
      zoom,
      pitch: 60,
      bearing: -17.6
    });

    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapInstance.addControl(new ThreeDControl(), 'top-right');

    mapInstance.on('style.load', () => {
      mapboxService.add3DBuildings(mapInstance);
    });

    return mapInstance;
  },

  add3DBuildings: (map: mapboxgl.Map) => {
    if (!map) return;
    if (map.getLayer('3d-buildings')) return;

    const layers = map.getStyle()?.layers;
    let labelLayerId: string | undefined;
    if (layers) {
      for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol' && (layers[i].layout as any)?.['text-field']) {
          labelLayerId = layers[i].id;
          break;
        }
      }
    }

    try {
      map.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': '#cbd5e1',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.75
          }
        },
        labelLayerId
      );
    } catch (e) {
      console.warn('Could not add 3D buildings layer:', e);
    }
  },

  geocode: async (address: string): Promise<[number, number] | null> => {
    const config = getMapboxConfig();
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${config.accessToken}&limit=1`;
    const response = await axios.get(url);
    const res = response.data;
    if (res.features && res.features.length > 0) {
      return res.features[0].center as [number, number];
    }
    return null;
  },

  reverseGeocode: async (lng: number, lat: number): Promise<any> => {
    const config = getMapboxConfig();
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${config.accessToken}&types=address,locality,neighborhood,postcode,place,district,region`;
    const response = await axios.get(url);
    const res = response.data;
    
    const details = { address: '', village: '', district: '', state: '', pincode: '' };

    if (res.features && res.features.length > 0) {
      details.address = res.features[0].place_name;
      for (const feature of res.features) {
        if (feature.place_type.includes('postcode')) {
          details.pincode = feature.text;
        } else if (feature.place_type.includes('locality')) {
          details.village = feature.text;
        } else if (feature.place_type.includes('place') || feature.place_type.includes('district')) {
          details.district = feature.text;
        } else if (feature.place_type.includes('region')) {
          details.state = feature.text;
        }
      }
    }
    return details;
  },

  getMarkerColor: (status: string): string => {
    switch (status) {
      case 'APPROVED': return '#10b981';
      case 'PENDING_AI':
      case 'PENDING_GOVT': return '#f59e0b';
      case 'REJECTED':
      case 'DISPUTED':
      default: return '#ef4444';
    }
  },

  addPropertyMarker: (
    mapInstance: mapboxgl.Map,
    property: Property,
    onClick?: (p: Property) => void,
    onScheduleVisit?: (p: Property) => void
  ): mapboxgl.Marker => {
    const color = mapboxService.getMarkerColor(property.status);

    const container = document.createElement('div');
    container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    container.style.padding = '4px 2px';
    container.style.minWidth = '190px';

    const titleEl = document.createElement('h4');
    titleEl.style.margin = '0 0 4px 0';
    titleEl.style.color = '#0f172a';
    titleEl.style.fontSize = '13px';
    titleEl.style.fontWeight = '700';
    titleEl.style.lineHeight = '1.3';
    titleEl.textContent = property.title || 'Untitled Property';

    const detailsEl = document.createElement('p');
    detailsEl.style.margin = '0 0 10px 0';
    detailsEl.style.color = '#475569';
    detailsEl.style.fontSize = '11.5px';
    detailsEl.style.fontWeight = '600';
    const formattedPrice = property.price ? `₹${property.price.toLocaleString('en-IN')}` : 'Price N/A';
    const areaText = property.area ? `${property.area} acres` : '';
    detailsEl.textContent = [formattedPrice, areaText].filter(Boolean).join(' • ');

    container.appendChild(titleEl);
    container.appendChild(detailsEl);

    if (onScheduleVisit) {
      const scheduleBtn = document.createElement('button');
      scheduleBtn.type = 'button';
      scheduleBtn.style.width = '100%';
      scheduleBtn.style.padding = '7.5px 12px';
      scheduleBtn.style.backgroundColor = '#2563eb';
      scheduleBtn.style.color = '#ffffff';
      scheduleBtn.style.border = 'none';
      scheduleBtn.style.borderRadius = '10px';
      scheduleBtn.style.fontSize = '11.5px';
      scheduleBtn.style.fontWeight = '700';
      scheduleBtn.style.cursor = 'pointer';
      scheduleBtn.style.display = 'flex';
      scheduleBtn.style.alignItems = 'center';
      scheduleBtn.style.justifyContent = 'center';
      scheduleBtn.style.gap = '6px';
      scheduleBtn.style.boxShadow = '0 2px 5px rgba(37,99,235,0.25)';
      scheduleBtn.style.transition = 'all 0.15s ease';

      scheduleBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
        <span>Schedule Visit</span>
      `;

      scheduleBtn.onmouseover = () => { scheduleBtn.style.backgroundColor = '#1d4ed8'; };
      scheduleBtn.onmouseout = () => { scheduleBtn.style.backgroundColor = '#2563eb'; };

      scheduleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onScheduleVisit(property);
      });

      container.appendChild(scheduleBtn);
    }

    const popup = new mapboxgl.Popup({ offset: 25, closeButton: true, maxWidth: '250px' }).setDOMContent(container);

    const marker = new mapboxgl.Marker({ color })
      .setLngLat([property.longitude, property.latitude])
      .setPopup(popup)
      .addTo(mapInstance);

    if (onClick) {
      marker.getElement().addEventListener('click', () => {
        onClick(property);
      });
    }

    return marker;
  }
};

