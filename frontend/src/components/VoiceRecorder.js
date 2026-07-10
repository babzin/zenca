import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';

export const VoiceRecorder = ({ onRecordComplete, disabled }) => {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [permission, setPermission] = useState(null);

  useEffect(() => {
    const getPermission = async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setPermission(status === 'granted');
    };
    getPermission();
  }, []);

  const startRecording = async () => {
    if (!permission) {
      Alert.alert('Permission needed', 'Please allow microphone access.');
      return;
    }
    if (isRecording) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined,
        60 // max duration 60 seconds
      );
      setRecording(recording);
      setIsRecording(true);
      setDuration(0);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setIsRecording(false);
      setRecording(null);
      if (onRecordComplete) onRecordComplete(uri);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration(prev => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container}>
      {!isRecording ? (
        <TouchableOpacity
          style={[styles.recordButton, disabled && styles.disabled]}
          onPress={startRecording}
          disabled={disabled}
        >
          <Text style={styles.buttonText}>Record Voice</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.recordingContainer}>
          <Text style={styles.timer}>{formatTime(duration)}</Text>
          <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  recordButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#757575',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  timer: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.5 },
});