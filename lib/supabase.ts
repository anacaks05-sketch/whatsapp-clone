import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://achrahaxgatzxqcaaynr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JiI-USExG6scG1RbGerkWw_r3UhhoLt';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Tipos das tabelas principais
export type Profile = {
  id: string;
  email: string | null;
  display_name: string;
  avatar_url: string | null;
  status_message: string;
  last_seen: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  status: 'sent' | 'delivered' | 'read';
  created_at: string;
};

export type Conversation = {
  id: string;
  is_group: boolean;
  name: string | null;
  created_at: string;
};
