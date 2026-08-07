import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabase';
import MapboxGL from '@rnmapbox/maps';
import { getDeviceUUID } from '../services/supabase';

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export default function AdminHeatmapScreen({ navigation }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [heatmapData, setHeatmapData] = useState([]);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [gridCells, setGridCells] = useState(0);
  const [maxDensity, setMaxDensity] = useState(0);
  const [days, setDays] = useState(30);
  const [selectedState, setSelectedState] = useState(null);
  const cameraRef = useRef(null);
  const mapRef = useRef(null);

  // Nigerian states list
  const states = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
    'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
    'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
    'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
    'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ];

  const loadHeatmap = async () => {
    try {
      const params = new URLSearchParams({ days: days.toString() });
      if (selectedState) params.append('state', selectedState);

      const edgeUrl = process.env.EXPO_PUBLIC_SUPABASE_EDGE_FUNCTION_URL;
      const response = await fetch(`${edgeUrl}/get-heatmap-data?${params.toString()}`);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        setHeatmapData(data.data);
        const total = data.data.reduce((acc, g) => acc + g.count, 0);
        setTotalAlerts(total);
        setGridCells(data.data.length);
        const max = Math.max(...data.data.map(g => g.count));
        setMaxDensity(max);
      } else {
        setHeatmapData([]);
        setTotalAlerts(0);
        setGridCells(0);
        setMaxDensity(0);
      }
    } catch (err) {
      console.error('Failed to load heatmap:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHeatmap();
  }, [days, selectedState]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadHeatmap();
  };

  // Build GeoJSON for heatmap (using point clustering)
  // Mapbox doesn't support heatmap directly with OpenFreeMap, so we use a workaround:
  // We'll show circles with varying sizes and colors based on density.
  const features = heatmapData.map(point => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [point.lng, point.lat],
    },
    properties: {
      count: point.count,
      // Normalize count for size/color
      intensity: point.count / (maxDensity || 1),
    },
  }));

  const sourceData = {
    type: 'FeatureCollection',
    features,
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    map: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text },
    statsBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 12,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: theme.primary },
    statLabel: { fontSize: 12, color: theme.textSecondary },
    controlsRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.card,
      flexWrap: 'wrap',
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    filterButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 6,
      marginBottom: 4,
    },
    filterButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filterText: { fontSize: 12, color: theme.text },
    filterTextActive: { color: '#fff' },
    legend: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: 'rgba(255,255,255,0.9)',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    legendColor: { width: 20, height: 4, borderRadius: 2, marginRight: 8 },
    legendText: { fontSize: 11, color: theme.text },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.text, marginTop: 12 }}>Loading heatmap...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📍 SOS Heatmap</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Text style={{ color: theme.primary }}>⟳ Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalAlerts}</Text>
          <Text style={styles.statLabel}>Total Alerts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{gridCells}</Text>
          <Text style={styles.statLabel}>Grid Cells</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{maxDensity}</Text>
          <Text style={styles.statLabel}>Max Density</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[7, 30, 90, 365].map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.filterButton, days === d && styles.filterButtonActive]}
              onPress={() => setDays(d)}
            >
              <Text style={[styles.filterText, days === d && styles.filterTextActive]}>
                {d}d
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.filterButton, !selectedState && styles.filterButtonActive]}
            onPress={() => setSelectedState(null)}
          >
            <Text style={[styles.filterText, !selectedState && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {states.slice(0, 10).map(state => (
            <TouchableOpacity
              key={state}
              style={[styles.filterButton, selectedState === state && styles.filterButtonActive]}
              onPress={() => setSelectedState(selectedState === state ? null : state)}
            >
              <Text style={[styles.filterText, selectedState === state && styles.filterTextActive]}>
                {state}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Map */}
      <View style={styles.map}>
        <MapboxGL.MapView
          ref={mapRef}
          style={styles.map}
          styleURL={OPENFREEMAP_STYLE}
          logoEnabled={false}
          attributionEnabled={false}
        >
          <MapboxGL.Camera
            ref={cameraRef}
            centerCoordinate={[8.6753, 9.0820]}
            zoomLevel={6}
          />

          {/* Heatmap via circles */}
          <MapboxGL.ShapeSource id="heatmap-source" shape={sourceData}>
            <MapboxGL.CircleLayer
              id="heatmap-layer"
              style={{
                circleRadius: [
                  'interpolate',
                  ['linear'],
                  ['get', 'count'],
                  1, 8,
                  5, 20,
                  10, 30,
                  20, 40,
                ],
                circleColor: [
                  'interpolate',
                  ['linear'],
                  ['get', 'intensity'],
                  0, '#4caf50',
                  0.3, '#8bc34a',
                  0.5, '#ffeb3b',
                  0.7, '#ff9800',
                  0.9, '#d32f2f',
                ],
                circleOpacity: 0.7,
                circleStrokeWidth: 0.5,
                circleStrokeColor: '#fff',
              }}
            />
          </MapboxGL.ShapeSource>
        </MapboxGL.MapView>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#d32f2f' }]} />
          <Text style={styles.legendText}>High density</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#ff9800' }]} />
          <Text style={styles.legendText}>Medium density</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4caf50' }]} />
          <Text style={styles.legendText}>Low density</Text>
        </View>
      </View>
    </View>
  );
}