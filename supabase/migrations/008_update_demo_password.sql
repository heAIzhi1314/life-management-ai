-- 更新demo用户的密码hash
UPDATE users 
SET password_hash = '$2b$10$ELF3YqsCrEUaRAwL.OBrIux1z5ZO.gBQkr18fPE/PEl4C0Rx20DqS'
WHERE email = 'demo@example.com';

-- 验证更新
SELECT email, name, plan_type, created_at FROM users WHERE email = 'demo@example.com';