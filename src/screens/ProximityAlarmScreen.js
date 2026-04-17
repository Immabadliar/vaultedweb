import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import dayjs from 'dayjs';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';

const isWeb = Platform.OS === 'web';
const webContainer = isWeb ? { maxWidth: 500, alignSelf: 'center', width: '100%' } : {};

const ALERTABLE_TYPES = new Set(['police', 'alarm']);
const DEFAULT_RADIUS_METERS = 1200;

function distanceMeters(aLat, aLon, bLat, bLon) {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * y;
}

export default function ProximityAlarmScreen() {
  const [armed, setArmed] = useState(true);
  const [radius, setRadius] = useState(DEFAULT_RADIUS_METERS);
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState('requesting precise location...');
  const [lastTrigger, setLastTrigger] = useState(null);
  const [lastAlert, setLastAlert] = useState(null);
  const locationSubRef = useRef(null);
  const cooldownRef = useRef(new Map());

  const requestPreciseLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      setStatus('location denied - alarm cannot monitor nearby police activity');
      Alert.alert('Precise location required', 'Enable location for accurate nearby police alarms.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open settings', onPress: () => Linking.openSettings() }
      ]);
      return false;
    }

    if (Platform.OS === 'android') {
      try {
        await Location.enableNetworkProviderAsync();
      } catch {
        // continue with current provider
      }
    }

    const initial = await Location.getCurrentPositionAsync({
      accuracy: Platform.OS === 'ios' ? Location.Accuracy.BestForNavigation : Location.Accuracy.Highest,
      mayShowUserSettingsDialog: true
    });

    setCoords({ latitude: initial.coords.latitude, longitude: initial.coords.longitude });
    setStatus('armed and listening');

    locationSubRef.current = await Location.watchPositionAsync(
      {
        accuracy: Platform.OS === 'ios' ? Location.Accuracy.BestForNavigation : Location.Accuracy.Highest,
        distanceInterval: 5,
        timeInterval: 3000,
        mayShowUserSettingsDialog: true
      },
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      }
    );

    return true;
  };

  useEffect(() => {
    requestPreciseLocation().catch(() => setStatus('location unavailable'));

    return () => {
      locationSubRef.current?.remove?.();
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('proximity-alarm')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, async (payload) => {
        const alertRow = payload.new;
        if (!armed || !coords) return;
        if (!ALERTABLE_TYPES.has(alertRow.type)) return;

        const key = `${alertRow.source}:${alertRow.id}`;
        if (cooldownRef.current.has(key)) return;

        const dist = distanceMeters(coords.latitude, coords.longitude, alertRow.latitude, alertRow.longitude);
        if (dist > radius) return;

        cooldownRef.current.set(key, Date.now());
        setLastAlert({ ...alertRow, distance: Math.round(dist) });
        setLastTrigger(new Date().toISOString());
        setStatus('THREAT NEARBY');

        Vibration.vibrate([0, 600, 250, 600]);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Vaulted Alert: Police Activity Nearby',
            body: `${Math.round(dist)}m away - ${alertRow.note || alertRow.type}`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX
          },
          trigger: null
        });

        Alert.alert('Police activity nearby', `${Math.round(dist)}m away. ${alertRow.note || ''}`.trim());
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [armed, coords, radius]);

  const radiusLabel = useMemo(() => `${Math.round(radius)}m`, [radius]);

  return (
    <View style={[styles.container, webContainer]}>
      <Text style={styles.title}>Proximity Alarm</Text>
      <Text style={styles.subtitle}>No map. Live police/alarm detection around your precise GPS.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>System</Text>
        <Text style={[styles.value, status === 'THREAT NEARBY' && styles.danger]}>{status}</Text>
        <Text style={styles.muted}>
          {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : 'Waiting for GPS lock'}
        </Text>
      </View>

      <View style={styles.row}>
        <Pressable style={[styles.toggle, armed ? styles.armed : styles.disarmed]} onPress={() => setArmed((v) => !v)}>
          <Text style={styles.toggleText}>{armed ? 'Armed' : 'Disarmed'}</Text>
        </Pressable>

        <View style={styles.radiusWrap}>
          <Text style={styles.label}>Radius: {radiusLabel}</Text>
          <View style={styles.radiusBtns}>
            <Pressable style={styles.radiusBtn} onPress={() => setRadius(600)}><Text style={styles.radiusText}>600m</Text></Pressable>
            <Pressable style={styles.radiusBtn} onPress={() => setRadius(1200)}><Text style={styles.radiusText}>1200m</Text></Pressable>
            <Pressable style={styles.radiusBtn} onPress={() => setRadius(2000)}><Text style={styles.radiusText}>2000m</Text></Pressable>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Last Trigger</Text>
        <Text style={styles.value}>{lastTrigger ? dayjs(lastTrigger).format('MMM D, h:mm:ss A') : 'None yet'}</Text>
        {lastAlert ? (
          <Text style={styles.muted}>
            {lastAlert.type.toUpperCase()} | {lastAlert.distance}m | {lastAlert.note || 'No note'}
          </Text>
        ) : (
          <Text style={styles.muted}>Waiting for nearby scanner/crowdsourced activity.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 14,
    gap: 12
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 8
  },
  subtitle: {
    color: colors.mutedText,
    marginBottom: 8
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 12
  },
  label: {
    color: colors.mutedText,
    fontSize: 12,
    textTransform: 'uppercase'
  },
  value: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4
  },
  danger: {
    color: colors.accent
  },
  muted: {
    color: colors.mutedText,
    marginTop: 6
  },
  row: {
    flexDirection: 'row',
    gap: 10
  },
  toggle: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  armed: {
    backgroundColor: colors.safe
  },
  disarmed: {
    backgroundColor: '#3f3f46'
  },
  toggleText: {
    color: '#0a0a0a',
    fontWeight: '800'
  },
  radiusWrap: {
    flex: 2,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 10
  },
  radiusBtns: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8
  },
  radiusBtn: {
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10
  },
  radiusText: {
    color: colors.text,
    fontWeight: '600'
  }
});
