import React from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Linking,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

export default function FeedbackScreen() {
  const handleEmail = (subject, body = '') => {
    const emailUrl = `mailto:zenca963@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(emailUrl).catch(() => {
      Alert.alert(
        'No Email App',
        'Please email zenca963@gmail.com manually from your email app.'
      );
    });
  };

  const handleDemoRequest = () => {
    const demoFormUrl = 'https://tally.so/r/rjYXbL';
    Linking.openURL(demoFormUrl).catch(() => {
      Alert.alert(
        'Cannot Open Link',
        'Please visit our website to request a demo.'
      );
    });
  };

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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Request a Demo</Text>
        <Text style={styles.cardText}>
          Interested in Zenca for your community, organization, or state?
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonDemo]}
          onPress={handleDemoRequest}
        >
          <Text style={styles.buttonText}>Request Demo</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        You can also email us directly at: zenca963@gmail.com
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#d32f2f',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  cardText: {
    fontSize: 14,
    color: '#666',
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
  buttonDemo: {
    backgroundColor: '#ff9800',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
});