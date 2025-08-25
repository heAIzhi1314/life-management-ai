-- 删除现有的demo用户（如果存在）
DELETE FROM users WHERE email = 'demo@example.com';

-- 创建新的demo用户，密码为'password123'
-- 使用bcrypt加密密码，这里使用预先计算的hash值
-- password123的bcrypt hash (salt rounds = 10)
INSERT INTO users (email, password_hash, name, plan_type) VALUES 
('demo@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Demo User', 'free');

-- 为demo用户创建一些示例数据
INSERT INTO records (user_id, content, type, tags) VALUES
((SELECT id FROM users WHERE email = 'demo@example.com'), '今天学习了React Hooks的使用方法', 'text', '["学习", "编程"]'),
((SELECT id FROM users WHERE email = 'demo@example.com'), '完成了项目的前端界面设计', 'text', '["工作", "设计"]'),
((SELECT id FROM users WHERE email = 'demo@example.com'), '晚上跑步30分钟，感觉很好', 'text', '["健康", "运动"]');

INSERT INTO plans (user_id, title, description, category, start_date, end_date, status, progress) VALUES
((SELECT id FROM users WHERE email = 'demo@example.com'), '学习AI开发', '深入学习人工智能和机器学习技术', 'study', '2024-01-01', '2024-06-30', 'active', 45),
((SELECT id FROM users WHERE email = 'demo@example.com'), '健身计划', '每周运动3次，保持身体健康', 'health', '2024-01-01', '2024-12-31', 'active', 60),
((SELECT id FROM users WHERE email = 'demo@example.com'), '项目开发', '完成个人生活管理AI助手项目', 'work', '2024-01-01', '2024-03-31', 'active', 75);

INSERT INTO reminders (user_id, title, description, remind_time, priority, is_completed) VALUES
((SELECT id FROM users WHERE email = 'demo@example.com'), '项目会议', '参加下午3点的项目进度会议', '2024-01-20 15:00:00+08', 'high', false),
((SELECT id FROM users WHERE email = 'demo@example.com'), '健身房锻炼', '今晚7点去健身房锻炼', '2024-01-20 19:00:00+08', 'medium', false),
((SELECT id FROM users WHERE email = 'demo@example.com'), '阅读技术文档', '阅读React最新版本的文档', '2024-01-21 10:00:00+08', 'low', false);

INSERT INTO health_data (user_id, data_type, data_value, record_date) VALUES
((SELECT id FROM users WHERE email = 'demo@example.com'), 'exercise', '{"type": "running", "duration": 30, "distance": 5, "calories": 300}', '2024-01-19'),
((SELECT id FROM users WHERE email = 'demo@example.com'), 'sleep', '{"bedtime": "23:30", "wake_time": "07:00", "quality": "good", "duration": 7.5}', '2024-01-19'),
((SELECT id FROM users WHERE email = 'demo@example.com'), 'weight', '{"weight": 70, "body_fat": 15, "muscle_mass": 55}', '2024-01-19');

-- 创建一些用户记忆数据
INSERT INTO user_memories (user_id, memory_type, key, value, confidence_score, source) VALUES
((SELECT id FROM users WHERE email = 'demo@example.com'), 'preference', 'programming_language', '{"preferred": "React", "experience": "intermediate"}', 0.9, 'conversation'),
((SELECT id FROM users WHERE email = 'demo@example.com'), 'habit', 'exercise_routine', '{"frequency": "3 times per week", "preferred_time": "evening", "type": "running"}', 0.8, 'behavior_analysis'),
((SELECT id FROM users WHERE email = 'demo@example.com'), 'goal', 'career_development', '{"target": "AI developer", "timeline": "6 months", "current_progress": "learning phase"}', 0.9, 'conversation');

-- 创建一些数据洞察
INSERT INTO data_insights (user_id, insight_type, category, title, description, data, is_active) VALUES
((SELECT id FROM users WHERE email = 'demo@example.com'), 'pattern', 'learning', '学习习惯分析', '用户倾向于在上午进行学习活动，学习效率较高', '{"confidence_score": 0.85, "data_source": "records_analysis"}', true),
((SELECT id FROM users WHERE email = 'demo@example.com'), 'recommendation', 'health', '运动建议', '基于当前运动数据，建议增加力量训练以平衡有氧运动', '{"confidence_score": 0.78, "data_source": "health_data_analysis"}', true),
((SELECT id FROM users WHERE email = 'demo@example.com'), 'trend', 'productivity', '项目进度趋势', '项目开发进度稳定，预计能按时完成目标', '{"confidence_score": 0.82, "data_source": "plans_analysis"}', true);