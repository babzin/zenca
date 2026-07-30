import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { getApplicationDetail, updateApplication, getAdminRole } from '../services/admin';

export default function AdminApplicationDetailScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params;
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await getApplicationDetail(id);
      setApp(data);
      const userRole = await getAdminRole();
      setRole(userRole || '');
      setLoading(false);
    };
    load();
  }, []);

  const handleAction = async (status) => {
    if (role === 'read_only') {
      Alert.alert('Permission Denied', 'You do not have permission to perform this action.');
      return;
    }
    setActionLoading(true);
    try {
      await updateApplication(id, status, comment);
      Alert.alert('Success', `Application ${status} successfully.`);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!app) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <Text style={{ color: theme.text }}>Application not found.</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 16,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
      marginTop: 8,
    },
    value: {
      fontSize: 16,
      color: theme.text,
      marginBottom: 4,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    statusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
      gap: 12,
    },
    actionBtn: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    approveBtn: {
      backgroundColor: '#10b981',
    },
    rejectBtn: {
      backgroundColor: '#ef4444',
    },
    actionText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    commentInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      color: theme.text,
      backgroundColor: theme.inputBackground,
      marginTop: 12,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    disabledBtn: {
      opacity: 0.5,
    },
  });

  const isPending = app.status === 'pending';
  const canAct = role !== 'read_only' && isPending;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>{app.full_name}</Text>
        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{app.phone}</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{app.email || 'N/A'}</Text>
        <Text style={styles.label}>Certification</Text>
        <Text style={styles.value}>{app.certification}</Text>
        <Text style={styles.label}>Certification ID</Text>
        <Text style={styles.value}>{app.certification_id || 'N/A'}</Text>
        <Text style={styles.label}>Insurance</Text>
        <Text style={styles.value}>{app.insurance_provider || 'N/A'} ({app.insurance_policy || 'N/A'})</Text>
        <Text style={styles.label}>NIN</Text>
        <Text style={styles.value}>{app.nin || 'N/A'}</Text>
        <Text style={styles.label}>BVN</Text>
        <Text style={styles.value}>{app.bvn || 'N/A'}</Text>
        <Text style={styles.label}>References</Text>
        <Text style={styles.value}>{app.ref1_name} ({app.ref1_phone}) | {app.ref2_name} ({app.ref2_phone})</Text>
        <Text style={styles.label}>Status</Text>
        <View style={[styles.statusBadge, { backgroundColor: app.status === 'pending' ? '#f59e0b' : app.status === 'approved' ? '#10b981' : '#ef4444' }]}>
          <Text style={styles.statusText}>{app.status.toUpperCase()}</Text>
        </View>

        {canAct && (
          <>
            <Text style={styles.label}>Comment (optional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment"
              placeholderTextColor={theme.textSecondary}
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn, actionLoading && styles.disabledBtn]}
                onPress={() => handleAction('approved')}
                disabled={actionLoading}
              >
                <Text style={styles.actionText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn, actionLoading && styles.disabledBtn]}
                onPress={() => handleAction('rejected')}
                disabled={actionLoading}
              >
                <Text style={styles.actionText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}