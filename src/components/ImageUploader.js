import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { colors } from '../theme/colors';

export default function ImageUploader({ label = 'Choose Image', value, onChange, disabled = false }) {
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    if (disabled) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1
      });

      if (!result.canceled) {
        onChange?.(result.assets[0].uri);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={pickImage} style={styles.button}>
        <Text style={styles.buttonText}>{label}</Text>
      </Pressable>
      {loading && <ActivityIndicator color={colors.accent} style={styles.loader} />}
      {value ? <Image source={value} style={styles.preview} contentFit="cover" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  button: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  buttonText: {
    color: colors.text,
    fontWeight: '600'
  },
  loader: {
    marginTop: 10
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    marginTop: 10
  }
});
