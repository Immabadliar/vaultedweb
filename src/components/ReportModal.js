import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ALERT_TYPES } from '../lib/constants';
import { colors } from '../theme/colors';

export default function ReportModal({ visible, onClose, onSubmit }) {
  const [type, setType] = useState('police');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onSubmit?.({ type, note: note.trim() });
      setNote('');
      setType('police');
      onClose?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Report Activity</Text>
          <View style={styles.typeRow}>
            {ALERT_TYPES.map((item) => (
              <Pressable key={item} style={[styles.typeBtn, type === item && styles.typeBtnActive]} onPress={() => setType(item)}>
                <Text style={styles.typeText}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            style={styles.input}
            placeholder="Optional note"
            placeholderTextColor={colors.mutedText}
            multiline
          />
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.submitBtn} onPress={submit}>
              {loading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.submitText}>Submit</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 12
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  typeBtn: {
    backgroundColor: '#1f1f1f',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  typeBtnActive: {
    backgroundColor: colors.accent
  },
  typeText: {
    color: colors.text,
    textTransform: 'capitalize'
  },
  input: {
    backgroundColor: '#1f1f1f',
    color: colors.text,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    minHeight: 80,
    textAlignVertical: 'top'
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  cancelText: {
    color: colors.mutedText,
    fontWeight: '600'
  },
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 88,
    alignItems: 'center'
  },
  submitText: {
    color: colors.text,
    fontWeight: '700'
  }
});
