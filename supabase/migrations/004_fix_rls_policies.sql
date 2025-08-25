-- 检查并修复RLS策略，确保用户可以插入洞察数据

-- 检查当前权限
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name IN ('data_insights', 'smart_recommendations', 'user_memories', 'conversations')
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- 确保authenticated角色有完整权限
GRANT ALL PRIVILEGES ON data_insights TO authenticated;
GRANT ALL PRIVILEGES ON smart_recommendations TO authenticated;
GRANT ALL PRIVILEGES ON user_memories TO authenticated;
GRANT ALL PRIVILEGES ON conversations TO authenticated;

-- 为anon角色授予基本权限（如果需要）
GRANT SELECT ON data_insights TO anon;
GRANT SELECT ON smart_recommendations TO anon;
GRANT SELECT ON user_memories TO anon;
GRANT SELECT ON conversations TO anon;

-- 检查RLS策略是否存在
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('data_insights', 'smart_recommendations', 'user_memories', 'conversations');

-- 如果需要，重新创建RLS策略
DROP POLICY IF EXISTS "Users can manage own insights" ON data_insights;
CREATE POLICY "Users can manage own insights" ON data_insights
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own recommendations" ON smart_recommendations;
CREATE POLICY "Users can manage own recommendations" ON smart_recommendations
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own memories" ON user_memories;
CREATE POLICY "Users can manage own memories" ON user_memories
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own conversations" ON conversations;
CREATE POLICY "Users can manage own conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);