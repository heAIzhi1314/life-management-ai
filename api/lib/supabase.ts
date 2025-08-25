import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// 后端使用service role key，拥有完整权限
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// 用于客户端认证的普通客户端
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!
export const supabase = createClient(supabaseUrl, supabaseAnonKey)