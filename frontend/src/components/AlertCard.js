import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native';

const getCategoryIcon = (category) => {
  const icons = {
    kidnapping: '🚨',
    banditry: '⚔️',
    terrorism: '💣',
    accident: '🚑',
    other: '⚠️',
  };
  return icons[category] || '⚠️';
};

const getCategoryColor = (category) => {
  const colors = {
    kidnapping: '#d32f2f',
    banditry: '#ff9800',
    terrorism: '#9c27b0',
    accident: '#2196f3',
    other: '#757575',
  };
  return colors[category] || '#757575';
};

export const AlertCard = ({
  alert,
  onReport,
  isReporting,
  onShare,
  showActions = true,
}) => {
  const handleShare = async () => {
    if (onShare) {
      onShare(alert);
      return;
    }
    const categoryIcon = getCategoryIcon(alert.category);
    const message = `${categoryIcon} ZENCA ALERT\n` +
      `Type: ${alert.category?.toUpperCase()}\n` +
      `Description: ${alert.text || 'No details'}\n` +
      `Distance: ${Math.round(alert.distance)}m away\n` +
      `Time: ${new Date(alert.created_at).toLocaleString()}\n\n` +
      `Stay safe. Verify before acting. Download Zenca: https://zenca.com/download`;
    await Share.share({
      message,
      title: `Zenca Alert - ${alert.category?.toUpperCase()}`,
    });
  };

  const handleReport = () => {
    if (onReport) onReport(alert.id);
  };

  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <View
      style={[
        styles.card,
        alert.isTest && styles.testCard,
        { borderLeftWidth: 4, borderLeftColor: getCategoryColor(alert.category) },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.category}>
          {getCategoryIcon(alert.category)} {alert.category?.toUpperCase()}
        </Text>
        {alert.isTest && <Text style={styles.testBadge}>TEST</Text>}
        {alert.edit_count > 0 && (
          <Text style={styles.editCount}>✏️ {alert.edit_count}</Text>
        )}
      </View>

      {alert.photo_url && (
        <Image source={{ uri: alert.photo_url }} style={styles.image} />
      )}

      <Text style={styles.text}>{alert.text || '(No description)'}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>{formatTimeAgo(alert.created_at)}</Text>
        <Text style={styles.meta}>{Math.round(alert.distance)}m away</Text>
      </View>

      {showActions && !alert.isTest && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleReport}
            disabled={isReporting}
          >
            <Text style={styles.actionText}>
              {isReporting ? '...' : '🚩 Report'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Text style={styles.actionText}>📤 Share</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  testCard: {
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  category: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  testBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#757575',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  editCount: {
    fontSize: 10,
    color: '#999',
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    marginBottom: 6,
    color: '#333',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  meta: {
    fontSize: 12,
    color: '#999',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
  },
  actionText: {
    fontSize: 12,
    color: '#757575',
  },
});