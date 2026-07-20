import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { submitGuardianApplication, getApplicationStatus } from '../services/guardian';

export default function GuardianApplicationForm({ navigation }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [existingStatus, setExistingStatus] = useState(null);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    certification: 'first_aid',
    certificationId: '',
    insuranceProvider: '',
    insurancePolicy: '',
    nin: '',
    bvn: '',
    ref1Name: '',
    ref1Phone: '',
    ref2Name: '',
    ref2Phone: '',
  });

  const certifications = [
    { label: 'First Aid', value: 'first_aid' },
    { label: 'Off-duty Medic', value: 'off_duty_medic' },
    { label: 'Police', value: 'police' },
    { label: 'Security', value: 'security' },
    { label: 'Other', value: 'other' },
  ];

  useEffect(() => {
    const checkExisting = async () => {
      const status = await getApplicationStatus();
      if (status) {
        setExistingStatus(status);
      }
    };
    checkExisting();
  }, []);

  const handleSubmit = async () => {
    // Basic validation
    if (!form.fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name.');
      return;
    }
    if (!form.phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number.');
      return;
    }
    if (!form.nin.trim() || !form.bvn.trim()) {
      Alert.alert('Error', 'NIN and BVN are required for verification.');
      return;
    }

    setLoading(true);
    try {
      await submitGuardianApplication(form);
      Alert.alert(
        'Application Submitted',
        'Your application has been submitted for review. You will be notified when it is approved.'
      );
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  if (existingStatus) {
    const statusMap = {
      pending: 'Your application is pending review.',
      approved: 'Your application has been approved! You are now a guardian.',
      rejected: 'Your application was rejected. Please contact support for more information.',
    };
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.statusText, { color: theme.text }]}>{statusMap[existingStatus.status] || 'Unknown status'}</Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.primary }]} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.text }]}>Apply to be a Guardian</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Fill in your details to become a verified responder.
      </Text>

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
        placeholder="Full Name *"
        placeholderTextColor={theme.textSecondary}
        value={form.fullName}
        onChangeText={(text) => setForm({ ...form, fullName: text })}
      />
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
        placeholder="Phone Number *"
        placeholderTextColor={theme.textSecondary}
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={(text) => setForm({ ...form, phone: text })}
      />
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
        placeholder="Email"
        placeholderTextColor={theme.textSecondary}
        keyboardType="email-address"
        autoCapitalize="none"
        value={form.email}
        onChangeText={(text) => setForm({ ...form, email: text })}
      />

      <Text style={[styles.label, { color: theme.text }]}>Certification</Text>
      <View style={styles.pickerContainer}>
        {certifications.map((cert) => (
          <TouchableOpacity
            key={cert.value}
            style={[
              styles.pickerOption,
              { borderColor: theme.border },
              form.certification === cert.value && { borderColor: theme.primary, backgroundColor: theme.primaryLight },
            ]}
            onPress={() => setForm({ ...form, certification: cert.value })}
          >
            <Text style={[styles.pickerText, { color: theme.text }]}>{cert.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
        placeholder="Certification ID / License Number"
        placeholderTextColor={theme.textSecondary}
        value={form.certificationId}
        onChangeText={(text) => setForm({ ...form, certificationId: text })}
      />
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
        placeholder="Insurance Provider"
        placeholderTextColor={theme.textSecondary}
        value={form.insuranceProvider}
        onChangeText={(text) => setForm({ ...form, insuranceProvider: text })}
      />
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
        placeholder="Insurance Policy Number"
        placeholderTextColor={theme.textSecondary}
        value={form.insurancePolicy}
        onChangeText={(text) => setForm({ ...form, insurancePolicy: text })}
      />
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
        placeholder="NIN (National ID Number) *"
        placeholderTextColor={theme.textSecondary}
        value={form.nin}
        onChangeText={(text) => setForm({ ...form, nin: text })}
      />
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
        placeholder="BVN (Bank Verification Number) *"
        placeholderTextColor={theme.textSecondary}
        value={form.bvn}
        onChangeText={(text) => setForm({ ...form, bvn: text })}
      />

      <Text style={[styles.sectionLabel, { color: theme.text }]}>References</Text>
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
        placeholder="Reference 1 Name"
        placeholderTextColor={theme.textSecondary}
        value={form.ref1Name}
        onChangeText={(text) => setForm({ ...form, ref1Name: text })}
      />
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
        placeholder="Reference 1 Phone"
        placeholderTextColor={theme.textSecondary}
        keyboardType="phone-pad"
        value={form.ref1Phone}
        onChangeText={(text) => setForm({ ...form, ref1Phone: text })}
      />
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
        placeholder="Reference 2 Name"
        placeholderTextColor={theme.textSecondary}
        value={form.ref2Name}
        onChangeText={(text) => setForm({ ...form, ref2Name: text })}
      />
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
        placeholder="Reference 2 Phone"
        placeholderTextColor={theme.textSecondary}
        keyboardType="phone-pad"
        value={form.ref2Phone}
        onChangeText={(text) => setForm({ ...form, ref2Phone: text })}
      />

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: theme.primary }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit Application</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 8 },
  sectionLabel: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  pickerText: { fontSize: 14 },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backButton: { padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  backButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  statusText: { fontSize: 18, textAlign: 'center', marginBottom: 20 },
});