import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View, Platform } from 'react-native';
import PostCard from '../components/PostCard';
import CommentModal from '../components/CommentModal';
import { colors } from '../theme/colors';
import { fetchPosts } from '../services/posts';
import { PAGE_SIZE } from '../lib/constants';
import { supabase } from '../lib/supabase';

const isWeb = Platform.OS === 'web';
const webContainer = isWeb ? { maxWidth: 600, alignSelf: 'center', width: '100%' } : {};

export default function FeedScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = useCallback(
    async (nextPage = 0, mode = 'initial') => {
      if (mode === 'more') setLoadingMore(true);
      if (mode === 'refresh') setRefreshing(true);
      if (mode === 'initial') setLoading(true);

      try {
        const data = await fetchPosts({ page: nextPage, pageSize: PAGE_SIZE });
        if (mode === 'more') {
          setPosts((prev) => [...prev, ...data]);
        } else {
          setPosts(data);
        }
        setHasMore(data.length === PAGE_SIZE);
        setPage(nextPage);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    const channel = supabase
      .channel('feed-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => loadPosts(0, 'refresh'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => loadPosts(0, 'refresh'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => loadPosts(0, 'refresh'))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadPosts]);

  const openProfile = (userId) => {
    navigation.navigate('UserProfile', { userId });
  };

  const footer = useMemo(() => {
    if (!loadingMore) return null;
    return <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} />;
  }, [loadingMore]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, webContainer]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl tintColor={colors.accent} refreshing={refreshing} onRefresh={() => loadPosts(0, 'refresh')} />}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onOpenComments={setSelectedPost}
            onOpenProfile={openProfile}
            onRefresh={() => loadPosts(0, 'refresh')}
          />
        )}
        onEndReached={() => {
          if (loadingMore || !hasMore) return;
          loadPosts(page + 1, 'more');
        }}
        onEndReachedThreshold={0.6}
        ListFooterComponent={footer}
      />

      <CommentModal visible={Boolean(selectedPost)} post={selectedPost} onClose={() => setSelectedPost(null)} />
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
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
