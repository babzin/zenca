

// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Alert } from '../types';
import { timeAgo, formatDistance } from '../services/alerts';

interface Props {
  alert: Alert;
}

export default function AlertCard({ alert }: Props) {
  const text = alert.text?.trim() || 'No details provided';
  const time = timeAgo(alert.created_at);
  const dist = alert.distance_km !== undefined ? formatDistance(alert.distance_km) : '';
  const wasEdited = alert.edit_count > 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.dot} />
        <Text style={styles.meta}>
          {time}{dist ? `  ·  ${dist}` : ''}
        </Text>
        {wasEdited && <Text style={styles.editedBadge}>edited</Text>}
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a0a0a',
    borderLeftWidth: 3,
    borderLeftColor: '#FF2222',
    borderRadius: 6,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF2222',
    marginRight: 8,
  },
  meta: {
    color: '#888',
    fontSize: 12,
    flex: 1,
  },
  editedBadge: {
    color: '#888',
    fontSize: 10,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  text: {
    color: '#F0F0F0',
    fontSize: 15,
    lineHeight: 21,
  },
});