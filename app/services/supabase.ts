import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import * as SecureStore from 'expo-secure-store';

// Custom storage implementation for React Native using SecureStore
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types for your Supabase tables
export type Database = {
  public: {
    Tables: {
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'expense' | 'income';
          amount_cents: number;
          category_id: string;
          timestamp: string;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          type: 'expense' | 'income';
          amount_cents: number;
          category_id: string;
          timestamp: string;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'expense' | 'income';
          amount_cents?: number;
          category_id?: string;
          timestamp?: string;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          name: string;
          icon: string;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          icon?: string;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          theme: 'light' | 'dark';
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: 'light' | 'dark';
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: 'light' | 'dark';
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      feedback: {
        Row: {
          id: string;
          user_id: string | null;
          user_email: string | null;
          category: 'improvement' | 'enhancement' | 'fixing' | 'error' | 'others';
          subject: string;
          message: string;
          image_urls: string[] | null;
          status: 'pending' | 'in_progress' | 'completed' | 'rejected';
          admin_notes: string | null;
          images_deleted_at: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          user_email?: string | null;
          category: 'improvement' | 'enhancement' | 'fixing' | 'error' | 'others';
          subject: string;
          message: string;
          image_urls?: string[] | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'rejected';
          admin_notes?: string | null;
          images_deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          user_email?: string | null;
          category?: 'improvement' | 'enhancement' | 'fixing' | 'error' | 'others';
          subject?: string;
          message?: string;
          image_urls?: string[] | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'rejected';
          admin_notes?: string | null;
          images_deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
      };
    };
  };
};
