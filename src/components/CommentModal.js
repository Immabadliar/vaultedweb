import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import dayjs from 'dayjs';
import { colors } from '../theme/colors';
import { createComment, fetchComments } from '../services/posts';
import { useAuth } from '../contexts/AuthContext';

export default function CommentModal({ visible, post, onClose }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!visible || !post?.id) return;
    setLoading(true);
    fetchComments(post.id)
      .then(setComments)
      .finally(() => setLoading(false));
  }, [visible, post?.id]);

  const handlePost = async () => {
    if (!text.trim() || !user || posting || !post?.id) return;
    setPosting(true);
    try {
      const created = await createComment({ post_id: post.id, user_id: user.id, text: text.trim() });
      setComments((prev) => [...prev, created]);
      setText('');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Comments</Text>
          <Pressable onPress={onClose}><Text style={styles.close}>Close</Text></Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                <Text style={styles.commentUser}>{item.users?.username || 'user'}</Text>
                <Text style={styles.commentText}>{item.text}</Text>
                <Text style={styles.commentMeta}>{dayjs(item.created_at).format('MMM D, h:mm A')}</Text>
              </View>
            )}
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write a comment"
            placeholderTextColor={colors.mutedText}
            style={styles.input}
          />
          <Pressable onPress={handlePost} style={styles.postBtn}>
            <Text style={styles.postBtnText}>{posting ? '...' : 'Post'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 54
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700'
  },
  close: {
    color: colors.accent,
    fontWeight: '700'
  },
  listContent: {
    padding: 16,
    gap: 10
  },
  commentItem: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 12
  },
  commentUser: {
    color: colors.text,
    fontWeight: '700'
  },
  commentText: {
    color: colors.text,
    marginTop: 4
  },
  commentMeta: {
    color: colors.mutedText,
    marginTop: 6,
    fontSize: 12
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 12
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  postBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  postBtnText: {
    color: colors.text,
    fontWeight: '700'
  }
});
