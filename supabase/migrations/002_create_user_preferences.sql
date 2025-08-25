-- 创建用户偏好设置表，用于存储关键词配置等个性化设置

-- 创建用户偏好设置表
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference_type VARCHAR(50) NOT NULL CHECK (preference_type IN ('keyword_config', 'ui_settings', 'notification_settings')),
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, preference_type, preference_key)
);

-- 创建关键词配置表（专门用于AI关键词识别）
CREATE TABLE keyword_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('record', 'reminder', 'plan', 'health', 'growth')),
    keywords TEXT[] NOT NULL,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_type ON user_preferences(preference_type);
CREATE INDEX idx_user_preferences_key ON user_preferences(preference_key);

CREATE INDEX idx_keyword_configs_user_id ON keyword_configs(user_id);
CREATE INDEX idx_keyword_configs_category ON keyword_configs(category);
CREATE INDEX idx_keyword_configs_priority ON keyword_configs(priority DESC);
CREATE INDEX idx_keyword_configs_active ON keyword_configs(is_active);
CREATE INDEX idx_keyword_configs_keywords ON keyword_configs USING GIN(keywords);

-- 设置权限
GRANT SELECT ON user_preferences TO anon;
GRANT ALL PRIVILEGES ON user_preferences TO authenticated;

GRANT SELECT ON keyword_configs TO anon;
GRANT ALL PRIVILEGES ON keyword_configs TO authenticated;

-- 插入默认关键词配置
INSERT INTO keyword_configs (user_id, category, keywords, priority) VALUES
((SELECT id FROM users WHERE email = 'demo@example.com'), 'record', ARRAY['记录', '记下', '保存', '备忘'], 1),
((SELECT id FROM users WHERE email = 'demo@example.com'), 'reminder', ARRAY['提醒', '提醒我', '别忘了', '记得'], 1),
((SELECT id FROM users WHERE email = 'demo@example.com'), 'plan', ARRAY['计划', '安排', '规划', '打算'], 1),
((SELECT id FROM users WHERE email = 'demo@example.com'), 'health', ARRAY['健康', '体重', '血压', '运动'], 1),
((SELECT id FROM users WHERE email = 'demo@example.com'), 'growth', ARRAY['成长', '学习', '进步', '目标'], 1);

-- 插入示例用户偏好设置
INSERT INTO user_preferences (user_id, preference_type, preference_key, preference_value) VALUES
((SELECT id FROM users WHERE email = 'demo@example.com'), 'ui_settings', 'theme', '{"mode": "light", "color": "blue"}'),
((SELECT id FROM users WHERE email = 'demo@example.com'), 'notification_settings', 'email_notifications', '{"enabled": true, "frequency": "daily"}');