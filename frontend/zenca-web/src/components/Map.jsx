import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const categoryColors = {
  kidnapping: '#d32f2f',
  banditry: '#ff9800',
  terrorism: '#9c27b0',
  accident: '#2196f3',
  other: '#757575',
};

export default function Map({ alerts = [], userLocation = null, height = '400px' }) {
  const mapRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    // Initialize map if not already
    if (!mapRef.current) {
      const map = L.map('map-container').setView([9.0820, 8.6753], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker) => map.removeLayer(marker));
    markersRef.current = {};

    // Add user location marker
    if (userLocation) {
      const userMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 10,
        color: '#d32f2f',
        fillColor: '#d32f2f',
        fillOpacity: 0.8,
        weight: 2,
      })
        .addTo(map)
        .bindPopup('You are here');
      markersRef.current['user'] = userMarker;
      // Center map on user
      map.setView([userLocation.lat, userLocation.lng], 13);
    }

    // Add alert markers
    alerts.forEach((alert) => {
      if (!alert.latitude || !alert.longitude) return;
      const color = categoryColors[alert.category] || '#757575';
      const marker = L.circleMarker([alert.latitude, alert.longitude], {
        radius: 8,
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
        weight: 2,
      })
        .addTo(map)
        .bindPopup(`
          <b>${alert.category?.toUpperCase() || 'Alert'}</b><br>
          ${alert.text || 'No details'}<br>
          <small>${new Date(alert.created_at).toLocaleString()}</small><br>
          <a href="/alert/${alert.id}" target="_blank">View Details</a>
        `);
      markersRef.current[alert.id] = marker;
    });

    // If there are alerts and no user location, fit bounds to show all markers
    if (alerts.length > 0 && !userLocation) {
      const group = L.featureGroup(Object.values(markersRef.current));
      map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  }, [alerts, userLocation]);

  return <div id="map-container" style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden' }} />;
}