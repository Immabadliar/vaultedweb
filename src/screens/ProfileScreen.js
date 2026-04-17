import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useAuth } from '../contexts/AuthContext';
import ProfileHeader from '../components/ProfileHeader';
import { fetchUserPosts } from '../services/posts';
import { getProfile, upsertProfile } from '../services/users';
import { colors } from '../theme/colors';
import ImageUploader from '../components/ImageUploader';
import { compressImage, fileUriToArrayBuffer } from '../lib/image';
import { uploadToBucket } from '../services/storage';

const isWeb = Platform.OS === 'web';
const webContainer = isWeb ? { maxWidth: 600, alignSelf: 'center', width: '100%' } : {};

export default function ProfileScreen({ route }) {
  const { user, profile: authProfile, refreshProfile } = useAuth();
  const userId = route?.params?.userId || user?.id;
  const isOwn = !route?.params?.userId || route.params.userId === user?.id;
  const [profile, setProfile] = useState(isOwn ? authProfile : null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!userId) return;
    const [p, userPosts] = await Promise.all([getProfile(userId), fetchUserPosts(userId)]);
    setProfile(p);
    setBio(p?.bio || '');
    // Filter posts to only include those with images for the grid
    const postsWithImages = userPosts.filter(post => post.image_url);
    setPosts(postsWithImages);
  }, [userId]);

  useEffect(() => {
    loadData().catch(() => null);
  }, [loadData]);

  const saveProfile = async () => {
    if (!isOwn || !user) return;
    setLoading(true);
    try {
      let avatar_url = profile?.avatar_url || null;
      if (avatarUri) {
        const compressed = await compressImage(avatarUri, 512);
        const buffer = await fileUriToArrayBuffer(compressed);
        const path = `${user.id}/avatar-${Date.now()}.jpg`;
        avatar_url = await uploadToBucket('avatars', path, buffer);
      }

      await upsertProfile({
        id: user.id,
        username: profile.username,
        bio: bio.trim(),
        avatar_url
      });

      await refreshProfile();
      await loadData();
      setEditing(false);
      setAvatarUri('');
    } catch (error) {
      Alert.alert('Profile update failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const header = useMemo(
    () => (
      <View>
        <ProfileHeader profile={profile} onEditPress={isOwn ? () => setEditing((prev) => !prev) : undefined} />
        {editing ? (
          <View style={styles.editCard}>
            <Text style={styles.editTitle}>Edit Profile</Text>
            <ImageUploader value={avatarUri} onChange={setAvatarUri} label="Change avatar" disabled={loading} />
            <TextInput
              value={bio}
              onChangeText={setBio}
              style={styles.input}
              placeholder="Update bio"
              placeholderTextColor={colors.mutedText}
              multiline
            />
            <Pressable style={styles.saveBtn} onPress={saveProfile}>
              <Text style={styles.saveText}>{loading ? 'Saving...' : 'Save changes'}</Text>
            </Pressable>
          </View>
        ) : null}
        <Text style={styles.sectionTitle}>Posts</Text>
      </View>
    ),
    [profile, isOwn, editing, avatarUri, loading, bio]
  );

  return (
    <View style={[styles.container, webContainer]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Image source={item.image_url} style={styles.gridImage} contentFit="cover" cachePolicy="memory-disk" />
        )}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  list: {
    padding: 12,
    paddingBottom: 24
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8
  },
  row: {
    gap: 6,
    marginBottom: 6
  },
  gridImage: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: colors.card
  },
  editCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
    marginBottom: 12
  },
  editTitle: {
    color: colors.text,
    fontWeight: '700'
  },
  input: {
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: '#1f1f1f',
    color: colors.text,
    borderRadius: 10,
    padding: 10
  },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 10
  },
  saveText: {
    color: colors.text,
    fontWeight: '700'
  }
});
