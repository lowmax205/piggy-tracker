import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../state/theme';
import type { AccountStackParamList } from '../navigation/AccountNavigator';
import { useFeedbackService } from '../services/feedback';

type FeedbackCategory = 'improvement' | 'enhancement' | 'fixing' | 'error' | 'others';

type ImageAttachment = {
  uri: string;
  width: number;
  height: number;
};

const CATEGORIES: { value: FeedbackCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'improvement', label: 'Improvement', icon: 'trending-up-outline' },
  { value: 'enhancement', label: 'Enhancement', icon: 'sparkles-outline' },
  { value: 'fixing', label: 'Bug Fix', icon: 'build-outline' },
  { value: 'error', label: 'Error Report', icon: 'alert-circle-outline' },
  { value: 'others', label: 'Others', icon: 'chatbubble-outline' },
];
const FeedbackScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AccountStackParamList>>();
  const { theme } = useTheme();
  const { submitFeedback } = useFeedbackService();

  const [category, setCategory] = useState<FeedbackCategory>('improvement');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to attach screenshots.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (images.length < 3) {
          setImages([...images, {
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
          }]);
        } else {
          Alert.alert('Limit Reached', 'You can attach up to 3 images.');
        }
      }
    } catch (error) {
      console.error('[FeedbackScreen] Error picking image', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };
  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert('Validation Error', 'Please enter a subject');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Validation Error', 'Please enter a message');
      return;
    }

    setIsSubmitting(true);

    // Submit feedback to Supabase with images
    const result = await submitFeedback({
      category,
      subject: subject.trim(),
      message: message.trim(),
      imageUris: images.map(img => img.uri), // Pass local URIs - service will upload them
    });

    setIsSubmitting(false);

    if (result.success) {
      Alert.alert(
        'Thank You! 🙏',
        'Your feedback has been received! I really appreciate you taking the time to help make this app better. I\'ll review it as soon as possible!',
        [
          {
            text: 'OK',
            onPress: () => {
              setCategory('improvement');
              setSubject('');
              setMessage('');
              setImages([]);
              // Navigate back to Account screen
              navigation.navigate('AccountHome');
            },
          },
        ],
      );
    } else {
      Alert.alert(
        'Submission Failed',
        result.error || 'Unable to submit feedback. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 40) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Send Feedback</Text>
            <Text style={[styles.subtitle, { color: theme.colors.subtitle }]}>
              Found a bug? Have a feature idea? Let me know! I read every single message. 💬
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const selected = category === cat.value;
                return (
                  <Pressable
                    key={cat.value}
                    style={[
                      styles.categoryCard,
                      { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
                      selected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                    ]}
                    onPress={() => setCategory(cat.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={24}
                      color={selected ? '#fff' : theme.colors.primary}
                    />
                    <Text
                      style={[
                        styles.categoryLabel,
                        { color: selected ? '#fff' : theme.colors.text },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Subject</Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="Brief description of your feedback"
              placeholderTextColor={theme.colors.subtitle}
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
              ]}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Message</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Describe your feedback in detail... the more info, the better!"
              placeholderTextColor={theme.colors.subtitle}
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
              ]}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Screenshots (Optional)
            </Text>
            <Text style={[styles.helperText, { color: theme.colors.subtitle }]}>
              Attach screenshots or images to help explain your feedback (up to 3 images)
            </Text>

            {images.length > 0 && (
              <View style={styles.imagesGrid}>
                {images.map((image, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <Pressable
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveImage(index)}
                      disabled={isSubmitting}
                    >
                      <Ionicons name="close-circle" size={24} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {images.length < 3 && (
              <Pressable
                style={[
                  styles.attachButton,
                  { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
                ]}
                onPress={handlePickImage}
                disabled={isSubmitting}
              >
                <Ionicons name="image-outline" size={24} color={theme.colors.primary} />
                <Text style={[styles.attachButtonText, { color: theme.colors.primary }]}>
                  {images.length > 0 ? 'Add Another Image' : 'Add Screenshot'}
                </Text>
              </Pressable>
            )}
          </View>

          <Pressable
            style={[
              styles.submitButton,
              { backgroundColor: theme.colors.primary },
              isSubmitting && { opacity: 0.6 },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Text style={styles.submitButtonText}>Sending...</Text>
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={20} color="#fff" style={styles.submitIcon} />
                <Text style={styles.submitButtonText}>Send Feedback</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  helperText: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  categoryCard: {
    width: '31%',
    marginHorizontal: '1%',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 12,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  attachButtonText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default FeedbackScreen;
