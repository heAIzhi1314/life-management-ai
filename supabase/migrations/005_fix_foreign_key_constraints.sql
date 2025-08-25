-- 修复AI记忆系统表的外键约束，从auth.users改为自定义users表

-- 删除现有的外键约束
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;
ALTER TABLE user_memories DROP CONSTRAINT IF EXISTS user_memories_user_id_fkey;
ALTER TABLE data_insights DROP CONSTRAINT IF EXISTS data_insights_user_id_fkey;
ALTER TABLE smart_recommendations DROP CONSTRAINT IF EXISTS smart_recommendations_user_id_fkey;

-- 添加新的外键约束，引用自定义users表
ALTER TABLE conversations ADD CONSTRAINT conversations_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_memories ADD CONSTRAINT user_memories_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE data_insights ADD CONSTRAINT data_insights_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE smart_recommendations ADD CONSTRAINT smart_recommendations_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 更新RLS策略，使用自定义用户认证逻辑
-- 由于使用自定义认证，我们需要禁用RLS或使用service_role_key
-- 这里选择禁用RLS，因为我们在应用层处理权限控制
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_memories DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE smart_recommendations DISABLE ROW LEVEL SECURITY;

-- 删除现有的RLS策略
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view own memories" ON user_memories;
DROP POLICY IF EXISTS "Users can manage own memories" ON user_memories;
DROP POLICY IF EXISTS "Users can view own insights" ON data_insights;
DROP POLICY IF EXISTS "Users can manage own insights" ON data_insights;
DROP POLICY IF EXISTS "Users can view own recommendations" ON smart_recommendations;
DROP POLICY IF EXISTS "Users can manage own recommendations" ON smart_recommendations;

-- 确保权限正确设置
GRANT ALL PRIVILEGES ON conversations TO authenticated;
GRANT ALL PRIVILEGES ON user_memories TO authenticated;
GRANT ALL PRIVILEGES ON data_insights TO authenticated;
GRANT ALL PRIVILEGES ON smart_recommendations TO authenticated;

GRANT SELECT ON conversations TO anon;
GRANT SELECT ON user_memories TO anon;
GRANT SELECT ON data_insights TO anon;
GRANT SELECT ON smart_recommendations TO anon;