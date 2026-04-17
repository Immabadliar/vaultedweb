import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../theme/colors';

export default function ProfileHeader({ profile, onEditPress }) {
  return (
    <View style={styles.wrap}>
      {profile?.avatar_url ? (
        <Image source={profile.avatar_url} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" />
      ) : (
        <View style={[styles.avatar, styles.fallback]}>
          <Text style={styles.fallbackText}>{profile?.username?.slice(0, 1)?.toUpperCase() || '?'}</Text>
        </View>
      )}
      <Text style={styles.username}>@{profile?.username || 'unknown'}</Text>
      <Text style={styles.bio}>{profile?.bio || 'No bio yet.'}</Text>
      {onEditPress ? (
        <Pressable style={styles.editBtn} onPress={onEditPress}>
          <Text style={styles.editText}>Edit Profile</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 12
  },
  fallback: {
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fallbackText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 28
  },
  username: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700'
  },
  bio: {
    color: colors.mutedText,
    marginTop: 8,
    textAlign: 'center'
  },
  editBtn: {
    marginTop: 14,
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10
  },
  editText: {
    color: colors.text,
    fontWeight: '700'
  }
});
