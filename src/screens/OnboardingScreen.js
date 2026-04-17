import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import ImageUploader from '../components/ImageUploader';
import { colors } from '../theme/colors';
import { compressImage, fileUriToArrayBuffer } from '../lib/image';
import { uploadToBucket } from '../services/storage';
import { upsertProfile, usernameExists } from '../services/users';

const isWeb = Platform.OS === 'web';
const webContainer = isWeb ? { maxWidth: 500, alignSelf: 'center', width: '100%' } : {};

export default function OnboardingScreen() {
  const { user, refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [loading, setLoading] = useState(false);

  const saveProfile = async () => {
    if (!username.trim()) {
      Alert.alert('Missing username', 'Add a username to continue.');
      return;
    }

    setLoading(true);
    try {
      const normalized = username.trim().toLowerCase().replace(/\s+/g, '_');
      const exists = await usernameExists(normalized);
      if (exists) {
        Alert.alert('Username taken', 'Pick a different username.');
        return;
      }

      let avatar_url = null;
      if (avatarUri) {
        const compressed = await compressImage(avatarUri, 512);
        const buffer = await fileUriToArrayBuffer(compressed);
        const path = `${user.id}/avatar-${Date.now()}.jpg`;
        avatar_url = await uploadToBucket('avatars', path, buffer);
      }

      await upsertProfile({
        id: user.id,
        username: normalized,
        bio: bio.trim(),
        avatar_url
      });

      await refreshProfile();
    } catch (error) {
      Alert.alert('Profile setup failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      style={[styles.scrollView, isWeb ? webContainer : {}]}
    >
      <Text style={styles.title}>Set up your Vaulted profile</Text>
      <Text style={styles.subtitle}>One-time setup before entering the app.</Text>

      <ImageUploader value={avatarUri} onChange={setAvatarUri} label="Upload profile image" disabled={loading} />

      <TextInput
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        placeholder="Username"
        placeholderTextColor={colors.mutedText}
        autoCapitalize="none"
      />

      <TextInput
        value={bio}
        onChangeText={setBio}
        style={[styles.input, styles.bio]}
        placeholder="Bio"
        placeholderTextColor={colors.mutedText}
        multiline
      />

      <Pressable style={styles.button} onPress={saveProfile}>
        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Continue'}</Text>
      </Pressable>
    </ScrollView>
  );
}

  const styles = StyleSheet.create({
    scrollView: {
      flex: 1,
    },
    container: {
      flexGrow: 1,
      backgroundColor: colors.background,
      padding: 16,
      gap: 12
    },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 22
  },
  subtitle: {
    color: colors.mutedText,
    marginBottom: 10
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  bio: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14
  },
  buttonText: {
    color: colors.text,
    fontWeight: '700'
  }
});
