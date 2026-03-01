import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import type { Database } from './database.types'

const supabaseUrl = 'https://yeknxnqkjwxzehlcvmtr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlla254bnFrand4emVobGN2bXRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxOTg0NTIsImV4cCI6MjA4Nzc3NDQ1Mn0.lIK3RY5jYWquXRlDPmWEuLJbH7mNRi7c9tR-eCd8LyY'

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
