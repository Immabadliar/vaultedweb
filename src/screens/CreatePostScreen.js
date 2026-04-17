import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Keyboard,
  Platform,
  Alert,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';

const isWeb = Platform.OS === 'web';
const webContainer = isWeb ? { maxWidth: 600, alignSelf: 'center', width: '100%' } : {};

export default function CreatePostScreen() {
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  const navigation = useNavigation();
  const captionInputRef = useRef(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      Alert.alert('Error', 'You must be logged in');
      navigation.goBack();
      return;
    }
    setUserId(user.id);
  };

  const dismissKeyboard = () => {
    captionInputRef.current?.blur();
    Keyboard.dismiss();
  };

  const pickImage = async () => {
    dismissKeyboard();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Use blob's type or default to JPEG
    const mimeType = blob.type || 'image/jpeg';
    
    // Determine file extension from mimeType
    const mimeToExt = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif',
    };
    const fileExt = mimeToExt[mimeType] || 'jpg';
    const fileName = `${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('posts')
      .upload(fileName, blob, {
        contentType: mimeType,
        upsert: true,
      });
    
    if (error) throw error;
    
    const { data } = supabase.storage
      .from('posts')
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  };

  const handlePost = async () => {
    dismissKeyboard();
    if (!caption && !image) {
      Alert.alert('Error', 'Add a caption or an image');
      return;
    }
    if (!userId) return;
    
    setLoading(true);
    try {
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }
      
      const { error } = await supabase.from('posts').insert({
        user_id: userId,
        image_url: imageUrl,
        caption: caption.trim() || null,
      });
      
      if (error) throw error;
      
      setImage(null);
      setCaption('');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={[styles.container, webContainer]}>
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={dismissKeyboard}
        >
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <Text style={styles.placeholder}>Tap to select image (optional)</Text>
            )}
          </TouchableOpacity>

          <TextInput
            ref={captionInputRef}
            placeholder="Write a caption..."
            placeholderTextColor="#777"
            value={caption}
            onChangeText={setCaption}
            style={styles.input}
          />

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.5 }]}
            onPress={handlePost}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Posting...' : 'Post'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  inner: {
    flexGrow: 1,
    padding: 16,
  },
  imagePicker: {
    height: 250,
    backgroundColor: '#121212',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    color: '#777',
  },
  input: {
    color: '#fff',
    backgroundColor: '#121212',
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 50,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#98079d',
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});