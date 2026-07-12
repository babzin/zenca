import React from 'react';
import {
  View,
  Text,
  Linking,
  Alert,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function FeedbackScreen() {
  const { theme } = useTheme();

  const handleEmail = (subject, body = '') => {
    const emailUrl = `mailto:zenca963@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(emailUrl).catch(() => {
      Alert.alert(
        'No Email App',
        'Please email zenca963@gmail.com manually from your email app.'
      );
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.background,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
      color: theme.primary,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 30,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.text,
    },
    cardText: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 12,
      lineHeight: 20,
    },
    button: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      alignSelf: 'flex-start',
    },
    buttonReport: {
      backgroundColor: '#d32f2f',
    },
    buttonSuggest: {
      backgroundColor: '#4caf50',
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
    },
    note: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: 20,
      marginBottom: 30,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Help & Feedback</Text>
      <Text style={styles.subtitle}>We're here to help you stay safe.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Report a Problem</Text>
        <Text style={styles.cardText}>
          Found a bug or issue? Let us know so we can fix it quickly.
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonReport]}
          onPress={() => handleEmail('Problem Report: Zenca', 'Please describe the issue:\n\n')}
        >
          <Text style={styles.buttonText}>Report Problem</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Suggest a Feature</Text>
        <Text style={styles.cardText}>
          Have an idea to make Zenca better? We'd love to hear it.
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonSuggest]}
          onPress={() => handleEmail('Feature Suggestion: Zenca', 'Describe your idea:\n\n')}
        >
          <Text style={styles.buttonText}>Suggest Feature</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        You can also email us directly at: zenca963@gmail.com
      </Text>
    </ScrollView>
  );
}