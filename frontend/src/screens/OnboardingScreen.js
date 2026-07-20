import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Send Real Alerts Only',
    text: 'Only send alerts for genuine emergencies. Your alert will be sent to the nearest verified guardians (within 500m) and your trusted family/friends.',
    color: '#d32f2f',
    backgroundColor: '#fff5f5',
  },
  {
    id: '2',
    title: 'Edit or Delete Within 1 Hour',
    text: 'You can edit or delete your alert within 1 hour. After that, it locks automatically. If you delete, nearby guardians and contacts are notified.',
    color: '#1976d2',
    backgroundColor: '#f0f7ff',
  },
  {
    id: '3',
    title: 'Guardians Respond, Not Everyone',
    text: 'Your SOS goes only to verified guardians and your trusted contacts – no public broadcast. You can track the guardian\'s arrival in real time.',
    color: '#4caf50',
    backgroundColor: '#f0fff0',
  },
];

export default function OnboardingScreen({ onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('@zenca_onboarding_seen', 'true');
    if (onComplete) onComplete();
  };

  const renderItem = ({ item }) => (
    <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
      <Text style={[styles.slideTitle, { color: item.color }]}>{item.title}</Text>
      <Text style={[styles.slideText, { color: '#333' }]}>{item.text}</Text>
    </View>
  );

  const onScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
      />
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={handleNext}>
          <Text style={styles.nextText}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  slide: {
    width: width,
    height: height - 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  slideText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  skipText: {
    fontSize: 16,
    color: '#999',
  },
  nextText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  pagination: {
    flexDirection: 'row',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#d32f2f',
    width: 20,
  },
  dotInactive: {
    backgroundColor: '#ccc',
  },
});