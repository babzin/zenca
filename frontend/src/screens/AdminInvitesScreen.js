import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getInvites, generateInvite, getAdminRole } from '../services/admin';

export default function AdminInvitesScreen() {
  const { theme } = useTheme();
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('read_only');
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [secret, setSecret] = useState('');

  const loadData = async () => {
    const data = await getInvites();
    setInvites(data);
    const role = await getAdminRole();
    setUserRole(role || '');
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleGenerate = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address.');
      return;
    }
    if (!secret.trim()) {
      Alert.alert('Error', 'Please enter the admin secret.');
      return;
    }
    setLoading(true);
    try {
      const result = await generateInvite(email.trim(), role, secret.trim());
      Alert.alert('Success', `Invite generated!\nLink: ${result.inviteLink}`);
      setEmail('');
      setSecret('');
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 16,
    },
    formCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 4,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 10,
      color: theme.text,
      backgroundColor: theme.inputBackground,
      marginBottom: 12,
    },
    picker: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 10,
      color: theme.text,
      backgroundColor: theme.inputBackground,
      marginBottom: 12,
    },
    generateBtn: {
      backgroundColor: theme.primary,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    generateBtnText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    inviteEmail: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
    },
    inviteMeta: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
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
    empty: {
      textAlign: 'center',
      color: theme.textSecondary,
      marginTop: 40,
    },
    disabledBtn: {
      opacity: 0.5,
    },
  });

  // Role dropdown options based on user role
  const getRoleOptions = () => {
    if (userRole === 'super_admin') {
      return [
        { label: 'Super Admin', value: 'super_admin' },
        { label: 'Agency Admin', value: 'agency_admin' },
        { label: 'Read Only', value: 'read_only' },
      ];
    } else if (userRole === 'agency_admin') {
      return [{ label: 'Read Only', value: 'read_only' }];
    } else {
      return [];
    }
  };

  const roleOptions = getRoleOptions();

  if (roleOptions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={{ color: theme.text, textAlign: 'center', marginTop: 40 }}>
          You do not have permission to generate invites.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.formCard}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="newadmin@agency.gov.ng"
          placeholderTextColor={theme.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Role</Text>
        <View style={styles.picker}>
          {roleOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setRole(opt.value)}
              style={{
                paddingVertical: 8,
                backgroundColor: role === opt.value ? theme.primary : 'transparent',
                paddingHorizontal: 12,
                borderRadius: 6,
                marginVertical: 2,
              }}
            >
              <Text style={{ color: role === opt.value ? '#fff' : theme.text }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Admin Secret</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter admin secret"
          placeholderTextColor={theme.textSecondary}
          value={secret}
          onChangeText={setSecret}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.generateBtn, loading && styles.disabledBtn]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateBtnText}>Generate Invite</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={invites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const status = item.used_at ? 'used' : (new Date(item.expires_at) < new Date() ? 'expired' : 'pending');
          const statusColor = status === 'pending' ? '#f59e0b' : status === 'used' ? '#6b7280' : '#ef4444';
          return (
            <View style={styles.card}>
              <Text style={styles.inviteEmail}>{item.email}</Text>
              <Text style={styles.inviteMeta}>Role: {item.role}</Text>
              <Text style={styles.inviteMeta}>Expires: {new Date(item.expires_at).toLocaleString()}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>{status.toUpperCase()}</Text>
              </View>
            </View>
          );
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.primary]} />}
        ListEmptyComponent={<Text style={styles.empty}>No invites yet.</Text>}
      />
    </View>
  );
}