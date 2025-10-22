import { supabase } from './supabase';
import { useAuthService } from './auth';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import Realm from 'realm';

export type FeedbackCategory = 'improvement' | 'enhancement' | 'fixing' | 'error' | 'others';

export type FeedbackSubmission = {
  category: FeedbackCategory;
  subject: string;
  message: string;
  imageUris?: string[]; // Local file URIs
};

export type FeedbackRow = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  category: FeedbackCategory;
  subject: string;
  message: string;
  image_urls: string[] | null;
  created_at: string;
};

const STORAGE_BUCKET = 'feedback-images';

/**
 * Hook to access feedback service methods
 */
export const useFeedbackService = () => {
  const { status, email } = useAuthService();
  const isAuthenticated = status === 'authenticated';

  /**
   * Upload an image to Supabase Storage
   */
  const uploadImage = async (localUri: string, feedbackId: string, index: number): Promise<{ url: string | null; error?: string }> => {
    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: 'base64',
      });

      // Generate unique filename
      const fileExt = localUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${feedbackId}_${index}.${fileExt}`;
      const filePath = `${fileName}`;

      // Convert base64 to ArrayBuffer
      const arrayBuffer = decode(base64);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (uploadError) {
        console.error('[FeedbackService] Upload error:', uploadError);
        return { url: null, error: uploadError.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      return { url: publicUrl };
    } catch (error) {
      console.error('[FeedbackService] Error uploading image:', error);
      return { url: null, error: 'Failed to upload image' };
    }
  };

  const submitFeedback = async (feedback: FeedbackSubmission): Promise<{ success: boolean; error?: string }> => {
    try {
      // Generate a temporary ID for organizing uploads
      const tempFeedbackId = new Realm.BSON.UUID().toString();
      
      // Upload images if provided
      let uploadedUrls: string[] = [];
      if (feedback.imageUris && feedback.imageUris.length > 0) {
        const uploadPromises = feedback.imageUris.map((uri, index) => 
          uploadImage(uri, tempFeedbackId, index)
        );
        
        const uploadResults = await Promise.all(uploadPromises);
        
        // Filter successful uploads
        uploadedUrls = uploadResults
          .filter(result => result.url !== null)
          .map(result => result.url!);
        
        // Log any upload failures but continue with submission
        const failedUploads = uploadResults.filter(result => result.error);
        if (failedUploads.length > 0) {
          console.warn('[FeedbackService] Some images failed to upload:', failedUploads);
        }
      }

      // Insert feedback into database
      const { error } = await supabase.from('feedback').insert({
        user_id: isAuthenticated ? (await supabase.auth.getUser()).data.user?.id ?? null : null,
        user_email: isAuthenticated ? email : null,
        category: feedback.category,
        subject: feedback.subject,
        message: feedback.message,
        image_urls: uploadedUrls.length > 0 ? uploadedUrls : null,
      });

      if (error) {
        console.error('[FeedbackService] Error submitting feedback:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[FeedbackService] Unexpected error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  return {
    submitFeedback,
  };
};
