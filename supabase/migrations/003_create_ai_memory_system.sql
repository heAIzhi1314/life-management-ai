-- 创建对话历史表
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  intent VARCHAR(50),
  actions JSONB DEFAULT '[]'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户记忆表
CREATE TABLE user_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type VARCHAR(50) NOT NULL, -- 'preference', 'habit', 'goal', 'context'
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 1.0, -- 0.0 to 1.0
  source VARCHAR(50) DEFAULT 'conversation', -- 'conversation', 'explicit', 'inferred'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, memory_type, key)
);

-- 创建数据洞察表
CREATE TABLE data_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL, -- 'trend', 'pattern', 'recommendation', 'summary'
  category VARCHAR(50) NOT NULL, -- 'records', 'health', 'plans', 'reminders'
  title VARCHAR(200) NOT NULL,
  description TEXT,
  data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- 创建智能推荐表
CREATE TABLE smart_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50) NOT NULL, -- 'action', 'habit', 'goal', 'optimization'
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  action_data JSONB,
  priority INTEGER DEFAULT 1, -- 1-5, 5 is highest
  confidence_score DECIMAL(3,2) DEFAULT 1.0,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'dismissed', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- 创建索引
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_conversations_intent ON conversations(intent);

CREATE INDEX idx_user_memories_user_id ON user_memories(user_id);
CREATE INDEX idx_user_memories_type ON user_memories(memory_type);
CREATE INDEX idx_user_memories_key ON user_memories(key);

CREATE INDEX idx_data_insights_user_id ON data_insights(user_id);
CREATE INDEX idx_data_insights_type ON data_insights(insight_type);
CREATE INDEX idx_data_insights_category ON data_insights(category);
CREATE INDEX idx_data_insights_active ON data_insights(is_active);

CREATE INDEX idx_smart_recommendations_user_id ON smart_recommendations(user_id);
CREATE INDEX idx_smart_recommendations_status ON smart_recommendations(status);
CREATE INDEX idx_smart_recommendations_priority ON smart_recommendations(priority DESC);

-- 启用行级安全策略
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_recommendations ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own memories" ON user_memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own memories" ON user_memories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own insights" ON data_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own insights" ON data_insights
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own recommendations" ON smart_recommendations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own recommendations" ON smart_recommendations
  FOR ALL USING (auth.uid() = user_id);

-- 授予权限
GRANT ALL PRIVILEGES ON conversations TO authenticated;
GRANT ALL PRIVILEGES ON user_memories TO authenticated;
GRANT ALL PRIVILEGES ON data_insights TO authenticated;
GRANT ALL PRIVILEGES ON smart_recommendations TO authenticated;

GRANT SELECT ON conversations TO anon;
GRANT SELECT ON user_memories TO anon;
GRANT SELECT ON data_insights TO anon;
GRANT SELECT ON smart_recommendations TO anon;