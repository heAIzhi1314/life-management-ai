import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://upqvrxbcprgpleiudyjl.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwcXZyeGJjcHJncGxlaXVkeWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwODcyNDEsImV4cCI6MjA3MTY2MzI0MX0.-LLkxj3wTs7ThP7GRzNfqAlxeiUnQ7wNGuMQFp4VvUQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库类型定义
export interface User {
  id: string
  email: string
  name: string
  plan_type: 'free' | 'premium'
  preferences: { [key: string]: any }
  created_at: string
  updated_at: string
}

export interface UserRecord {
  id: string
  user_id: string
  content: string
  type: 'text' | 'voice' | 'image'
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Reminder {
  id: string
  user_id: string
  title: string
  description?: string
  remind_time?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_completed: boolean
  location_trigger?: { [key: string]: any }
  repeat_pattern?: string
  created_at: string
}

export interface Plan {
  id: string
  user_id: string
  title: string
  description?: string
  category: 'work' | 'personal' | 'study' | 'health'
  start_date?: string
  end_date?: string
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  progress: number
  created_at: string
}

export interface Task {
  id: string
  plan_id: string
  title: string
  description?: string
  is_completed: boolean
  due_date?: string
  order_index: number
  created_at: string
}

export interface HealthData {
  id: string
  user_id: string
  data_type: 'exercise' | 'sleep' | 'nutrition' | 'weight' | 'blood_pressure'
  data_value: { [key: string]: any }
  record_date: string
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description?: string
  category: 'work' | 'personal' | 'study' | 'health'
  target_date?: string
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  metrics: { [key: string]: any }
  created_at: string
}

export interface Milestone {
  id: string
  goal_id: string
  title: string
  description?: string
  target_date?: string
  is_achieved: boolean
  achieved_at?: string
}