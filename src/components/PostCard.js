import React, { memo, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { colors } from '../theme/colors';
import { toggleLike } from '../services/posts';
import { useAuth } from '../contexts/AuthContext';

dayjs.extend(relativeTime);

function PostCard({ post, onOpenComments, onOpenProfile, onRefresh }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const likes = post.likes?.length ?? 0;
  const comments = post.comments?.length ?? 0;
  const liked = useMemo(() => post.likes?.some((entry) => entry.user_id === user?.id), [post.likes, user?.id]);

  const handleLike = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      await toggleLike({ postId: post.id, userId: user.id, liked });
      onRefresh?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <Pressable style={styles.header} onPress={() => onOpenProfile?.(post.users?.id)}>
        {post.users?.avatar_url ? (
          <Image source={post.users.avatar_url} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{post.users?.username?.slice(0, 1)?.toUpperCase() || '?'}</Text>
          </View>
        )}
        <View>
          <Text style={styles.username}>{post.users?.username || 'unknown'}</Text>
          <Text style={styles.meta}>{dayjs(post.created_at).fromNow()}</Text>
        </View>
      </Pressable>

      {post.image_url ? (
        <Image source={post.image_url} style={styles.image} contentFit="cover" cachePolicy="memory-disk" />
      ) : null}

      <View style={styles.actions}>
        <Pressable onPress={handleLike} disabled={busy}>
          <Text style={[styles.actionText, liked && styles.liked]}>{liked ? 'Liked' : 'Like'}</Text>
        </Pressable>
        <Pressable onPress={() => onOpenComments?.(post)}>
          <Text style={styles.actionText}>Comment</Text>
        </Pressable>
      </View>

      <Text style={styles.counts}>{likes} likes  {comments} comments</Text>
      {!!post.caption && <Text style={styles.caption}>{post.caption}</Text>}
      {!!post.location && <Text style={styles.location}>@ {post.location}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272A'
  },
  avatarText: {
    color: colors.text,
    fontWeight: '700'
  },
  username: {
    color: colors.text,
    fontWeight: '700'
  },
  meta: {
    color: colors.mutedText,
    fontSize: 12
  },
  image: {
    width: '100%',
    aspectRatio: 1
  },
  actions: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 12,
    paddingTop: 10
  },
  actionText: {
    color: colors.text,
    fontWeight: '600'
  },
  liked: {
    color: colors.accent
  },
  counts: {
    color: colors.mutedText,
    paddingHorizontal: 12,
    paddingTop: 10,
    fontSize: 12
  },
  caption: {
    color: colors.text,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 2
  },
  location: {
    color: colors.mutedText,
    paddingHorizontal: 12,
    paddingBottom: 12,
    fontSize: 12
  }
});

export default memo(PostCard);
