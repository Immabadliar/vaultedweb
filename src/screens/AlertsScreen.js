import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import dayjs from 'dayjs';
import * as Location from 'expo-location';
import { fetchAlerts } from '../services/alerts';
import { colors, alertTypeColors } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { ingestScannerAlerts } from '../services/scanner';
import { createAlert } from '../services/alerts';
import { useAuth } from '../contexts/AuthContext';
import ReportModal from '../components/ReportModal';

const isWeb = Platform.OS === 'web';
const webContainer = isWeb ? { maxWidth: 600, alignSelf: 'center', width: '100%' } : {};

export default function AlertsScreen() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    fetchAlerts().then(setAlerts).catch(() => null);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('alerts-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, (payload) => {
        setAlerts((prev) => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const syncScanner = async () => {
    setSyncing(true);
    try {
      await ingestScannerAlerts();
    } finally {
      setSyncing(false);
    }
  };

  const getPrecisePosition = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') throw new Error('Location permission denied.');
    if (Platform.OS === 'android') {
      try {
        await Location.enableNetworkProviderAsync();
      } catch {
        // continue
      }
    }
    return Location.getCurrentPositionAsync({
      accuracy:
        Platform.OS === 'ios'
          ? Location.Accuracy.BestForNavigation
          : Location.Accuracy.Highest,
      mayShowUserSettingsDialog: true
    });
  };

  const submitReport = async ({ type, note }) => {
    try {
      const pos = await getPrecisePosition();
      await createAlert({
        user_id: user?.id ?? null,
        type,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        note,
        source: 'user'
      });
    } catch (error) {
      Alert.alert('Report failed', error.message);
    }
  };

  const formatCoord = (value) => {
    const n = Number(value);
    if (Number.isNaN(n)) return 'n/a';
    return n.toFixed(4);
  };

  return (
    <View style={[styles.container, webContainer]}>
      <Pressable style={styles.syncBtn} onPress={syncScanner}>
        <Text style={styles.syncText}>{syncing ? 'Syncing...' : 'Sync Scanner Feed'}</Text>
      </Pressable>
      <Pressable style={styles.reportBtn} onPress={() => setReportOpen(true)}>
        <Text style={styles.reportText}>Report Activity (Precise GPS)</Text>
      </Pressable>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.dot, { backgroundColor: alertTypeColors[item.type] || colors.accent }]} />
            <View style={styles.content}>
              <Text style={styles.type}>{item.type.toUpperCase()}  ({item.source})</Text>
              <Text style={styles.note}>{item.note || 'No note'}</Text>
              <Text style={styles.meta}>
                {formatCoord(item.latitude)}, {formatCoord(item.longitude)}  |  {dayjs(item.created_at).format('MMM D h:mm A')}
              </Text>
            </View>
          </View>
        )}
      />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} onSubmit={submitReport} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  syncBtn: {
    marginTop: 12,
    marginHorizontal: 12,
    backgroundColor: colors.accent,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12
  },
  syncText: {
    color: colors.text,
    fontWeight: '700'
  },
  reportBtn: {
    marginTop: 8,
    marginHorizontal: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12
  },
  reportText: {
    color: colors.text,
    fontWeight: '700'
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    gap: 10
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6
  },
  content: {
    flex: 1
  },
  type: {
    color: colors.text,
    fontWeight: '700'
  },
  note: {
    color: colors.text,
    marginTop: 4
  },
  meta: {
    color: colors.mutedText,
    marginTop: 6,
    fontSize: 12
  }
});
