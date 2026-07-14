import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

const { height } = Dimensions.get('window');

export const NotificationBanner = ({ notification, onDismiss }) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-100)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 12,
        bounciness: 4,
      }).start();
      // Auto‑dismiss after 6 seconds
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, 6000);
    } else {
      setVisible(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification]);

  const handleDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      onDismiss();
    });
  };

  const handleView = () => {
    if (notification && notification.alert_id) {
      // We need the full alert object; we can either fetch it or store it in state.
      // For simplicity, we'll navigate with what we have, but the AlertDetail expects 'alert' object.
      // We'll construct a minimal alert object from the notification data.
      const alert = {
        id: notification.alert_id,
        category: notification.category || 'other',
        text: notification.body || 'No details',
        created_at: new Date().toISOString(),
        distance: notification.distance || 0,
        latitude: notification.latitude,
        longitude: notification.longitude,
        photo_url: notification.photo_url || null,
        audio_url: notification.audio_url || null,
      };
      handleDismiss();
      navigation.navigate('AlertDetail', { alert });
    } else {
      handleDismiss();
    }
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

  const getCategoryName = (category) => {
    const names = {
      kidnapping: 'Kidnapping',
      banditry: 'Banditry',
      terrorism: 'Terrorism',
      accident: 'Accident',
      other: 'Other',
    };
    return names[category] || 'Other';
  };

  if (!visible || !notification) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: getCategoryColor(notification.category),
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          {getCategoryName(notification.category).toUpperCase()}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {notification.body || 'New alert received'}
        </Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.viewButton} onPress={handleView}>
            <Text style={styles.buttonText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 10,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    marginTop: 28, // to avoid status bar
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  dismissButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  dismissText: {
    color: '#fff',
    fontSize: 13,
  },
});