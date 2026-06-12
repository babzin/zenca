import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EmergencyDisclaimerScreen({ onAgree }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkIfShown = async () => {
      const hasSeen = await AsyncStorage.getItem('@zenca_disclaimer_seen');
      if (!hasSeen) {
        setVisible(true);
      } else {
        onAgree && onAgree();
      }
    };
    checkIfShown();
  }, []);

  const handleAgree = async () => {
    await AsyncStorage.setItem('@zenca_disclaimer_seen', 'true');
    setVisible(false);
    onAgree && onAgree();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>⚠️ Emergency Disclaimer</Text>
            <Text style={styles.text}>
              Zenca is a community alert tool, **not a replacement for official emergency services**.
            </Text>
            <Text style={styles.text}>
              Always verify alerts before acting. False alarms can be deleted by the sender within 1 hour.
            </Text>
            <Text style={styles.text}>
              By using this app, you agree to use it responsibly for genuine emergencies only. 
              Zenca does not guarantee response times or accuracy of user‑submitted information.
            </Text>
            <Text style={styles.text}>
              In a life‑threatening situation, always call your local emergency number (e.g., 112) first.
            </Text>
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={handleAgree}>
            <Text style={styles.buttonText}>I Understand</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 350,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#d32f2f',
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});