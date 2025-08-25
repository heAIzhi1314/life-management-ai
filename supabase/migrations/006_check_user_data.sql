-- 查看用户表中的数据
SELECT id, email, name, plan_type, created_at FROM users;

-- 查看demo用户的具体信息
SELECT * FROM users WHERE email = 'demo@example.com';

-- 查看该用户的相关数据
SELECT 
  (SELECT COUNT(*) FROM records WHERE user_id = (SELECT id FROM users WHERE email = 'demo@example.com')) as records_count,
  (SELECT COUNT(*) FROM plans WHERE user_id = (SELECT id FROM users WHERE email = 'demo@example.com')) as plans_count,
  (SELECT COUNT(*) FROM reminders WHERE user_id = (SELECT id FROM users WHERE email = 'demo@example.com')) as reminders_count,
  (SELECT COUNT(*) FROM health_data WHERE user_id = (SELECT id FROM users WHERE email = 'demo@example.com')) as health_data_count,
  (SELECT COUNT(*) FROM conversations WHERE user_id = (SELECT id FROM users WHERE email = 'demo@example.com')) as conversations_count,
  (SELECT COUNT(*) FROM user_memories WHERE user_id = (SELECT id FROM users WHERE email = 'demo@example.com')) as memories_count,
  (SELECT COUNT(*) FROM data_insights WHERE user_id = (SELECT id FROM users WHERE email = 'demo@example.com')) as insights_count;