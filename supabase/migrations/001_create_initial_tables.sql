-- 个人全生命周期管理AI助手 - 数据库初始化脚本

-- 创建用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建记录表
CREATE TABLE records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'text' CHECK (type IN ('text', 'voice', 'image')),
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建提醒表
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    remind_time TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_completed BOOLEAN DEFAULT FALSE,
    location_trigger JSONB,
    repeat_pattern VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建计划表
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'personal' CHECK (category IN ('work', 'personal', 'study', 'health')),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建任务表
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    due_date DATE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建健康数据表
CREATE TABLE health_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_type VARCHAR(50) NOT NULL CHECK (data_type IN ('exercise', 'sleep', 'nutrition', 'weight', 'blood_pressure')),
    data_value JSONB NOT NULL,
    record_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建目标表
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'personal' CHECK (category IN ('work', 'personal', 'study', 'health')),
    target_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建里程碑表
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_date DATE,
    is_achieved BOOLEAN DEFAULT FALSE,
    achieved_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_plan_type ON users(plan_type);

CREATE INDEX idx_records_user_id ON records(user_id);
CREATE INDEX idx_records_created_at ON records(created_at DESC);
CREATE INDEX idx_records_tags ON records USING GIN(tags);

CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_remind_time ON reminders(remind_time);
CREATE INDEX idx_reminders_priority ON reminders(priority);

CREATE INDEX idx_plans_user_id ON plans(user_id);
CREATE INDEX idx_plans_category ON plans(category);
CREATE INDEX idx_plans_status ON plans(status);

CREATE INDEX idx_tasks_plan_id ON tasks(plan_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

CREATE INDEX idx_health_data_user_id ON health_data(user_id);
CREATE INDEX idx_health_data_type ON health_data(data_type);
CREATE INDEX idx_health_data_date ON health_data(record_date DESC);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_category ON goals(category);
CREATE INDEX idx_goals_status ON goals(status);

CREATE INDEX idx_milestones_goal_id ON milestones(goal_id);
CREATE INDEX idx_milestones_target_date ON milestones(target_date);

-- 设置权限
GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;

GRANT SELECT ON records TO anon;
GRANT ALL PRIVILEGES ON records TO authenticated;

GRANT SELECT ON reminders TO anon;
GRANT ALL PRIVILEGES ON reminders TO authenticated;

GRANT SELECT ON plans TO anon;
GRANT ALL PRIVILEGES ON plans TO authenticated;

GRANT SELECT ON tasks TO anon;
GRANT ALL PRIVILEGES ON tasks TO authenticated;

GRANT SELECT ON health_data TO anon;
GRANT ALL PRIVILEGES ON health_data TO authenticated;

GRANT SELECT ON goals TO anon;
GRANT ALL PRIVILEGES ON goals TO authenticated;

GRANT SELECT ON milestones TO anon;
GRANT ALL PRIVILEGES ON milestones TO authenticated;

-- 插入示例数据
INSERT INTO users (email, password_hash, name, plan_type) VALUES
('demo@example.com', '$2b$10$example_hash', '演示用户', 'premium');

-- 插入示例记录
INSERT INTO records (user_id, content, type, tags) VALUES
((SELECT id FROM users WHERE email = 'demo@example.com'), '明天下午3点开会讨论项目进展', 'text', '["工作", "会议"]');

-- 插入示例提醒
INSERT INTO reminders (user_id, title, description, remind_time, priority) VALUES
((SELECT id FROM users WHERE email = 'demo@example.com'), '项目会议', '讨论Q4项目进展和里程碑', '2024-01-15 15:00:00+08', 'high');

-- 插入示例计划
INSERT INTO plans (user_id, title, description, category, start_date, end_date, status, progress) VALUES
((SELECT id FROM users WHERE email = 'demo@example.com'), '学习React开发', '掌握React框架和相关技术栈', 'study', '2024-01-01', '2024-03-31', 'active', 30);

-- 插入示例健康数据
INSERT INTO health_data (user_id, data_type, data_value, record_date) VALUES
((SELECT id FROM users WHERE email = 'demo@example.com'), 'exercise', '{"type": "running", "duration": 30, "distance": 5}', '2024-01-10');