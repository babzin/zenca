import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export const ChatBubble = ({ message, isOwn }) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      alignSelf: isOwn ? 'flex-end' : 'flex-start',
      maxWidth: '80%',
      marginVertical: 4,
      marginHorizontal: 8,
    },
    bubble: {
      padding: 12,
      borderRadius: 16,
      backgroundColor: isOwn ? theme.primary : theme.card,
      borderWidth: isOwn ? 0 : 1,
      borderColor: theme.border,
    },
    text: {
      color: isOwn ? '#fff' : theme.text,
      fontSize: 15,
    },
    time: {
      fontSize: 10,
      color: isOwn ? 'rgba(255,255,255,0.7)' : theme.textSecondary,
      marginTop: 4,
      alignSelf: 'flex-end',
    },
  });

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{message.message}</Text>
        <Text style={styles.time}>{formatTime(message.created_at)}</Text>
      </View>
    </View>
  );
};