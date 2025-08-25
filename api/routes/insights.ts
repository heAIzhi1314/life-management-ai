import { Router } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase.js';
import { authenticateToken } from './auth.js';

const router = Router();

// 应用认证中间件到所有路由
router.use(authenticateToken);

// 获取数据洞察
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type, category, active_only = true } = req.query;

    let query = supabase
      .from('data_insights')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false });

    if (type) {
      query = query.eq('insight_type', type);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (active_only === 'true') {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching insights:', error);
      return res.status(500).json({ error: 'Failed to fetch insights' });
    }

    res.json({ insights: data || [] });
  } catch (error) {
    console.error('Error in insights GET:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 生成新的数据洞察
router.post('/generate', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 检查用户是否存在，如果不存在则创建
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingUser) {
      console.log('User not found, creating user record for:', userId);
      // 从JWT token中获取用户信息
      const userEmail = req.user?.email || `user_${userId}@temp.com`;
      
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: userEmail,
          password_hash: 'temp_hash', // 临时密码哈希
          name: 'AI用户',
          plan_type: 'free'
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return res.status(500).json({ error: 'Failed to create user record' });
      }
      
      console.log('User created successfully:', newUser.id);
    }

    const { categories = ['records', 'health', 'plans', 'reminders'] } = req.body;

    // 生成各类数据洞察
    const insights = [];

    for (const category of categories) {
      const categoryInsights = await generateInsightsForCategory(userId, category);
      insights.push(...categoryInsights);
    }

    // 保存洞察到数据库
    if (insights.length > 0) {
      console.log('Attempting to save insights:', JSON.stringify(insights, null, 2));
      
      // 首先尝试使用supabaseAdmin客户端
      let { data, error } = await supabaseAdmin
        .from('data_insights')
        .insert(insights)
        .select();

      // 如果仍然遇到RLS错误，尝试备用方案
      if (error && (error.code === '42501' || error.code === 'PGRST116')) {
        console.log('RLS policy issue detected, attempting backup insertion method...');
        
        // 备用方案：逐条插入并跳过失败的记录
        const successfulInserts = [];
        for (const insight of insights) {
          try {
            const { data: singleData, error: singleError } = await supabaseAdmin
              .from('data_insights')
              .insert([insight])
              .select();
            
            if (!singleError && singleData) {
              successfulInserts.push(...singleData);
            } else {
              console.warn('Failed to insert single insight:', singleError);
            }
          } catch (singleInsertError) {
            console.warn('Exception during single insight insertion:', singleInsertError);
          }
        }
        
        if (successfulInserts.length > 0) {
          console.log('Backup insertion successful:', successfulInserts.length, 'records');
          data = successfulInserts;
          error = null;
        }
      }

      if (error && (!data || data.length === 0)) {
        console.error('Error saving insights:', {
          error: error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          insights: insights
        });
        return res.status(500).json({ 
          error: 'Failed to save insights',
          details: error.message,
          code: error.code
        });
      }

      console.log('Successfully saved insights:', data?.length || 0, 'records');
      res.status(201).json({ insights: data });
    } else {
      console.log('No new insights generated for user:', userId);
      res.json({ insights: [], message: 'No new insights generated' });
    }
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取智能推荐
router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type, status = 'pending', limit = 10 } = req.query;

    let query = supabase
      .from('smart_recommendations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (type) {
      query = query.eq('recommendation_type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching recommendations:', error);
      return res.status(500).json({ error: 'Failed to fetch recommendations' });
    }

    res.json({ recommendations: data || [] });
  } catch (error) {
    console.error('Error in recommendations GET:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 生成智能推荐
router.post('/recommendations/generate', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 生成个性化推荐
    const recommendations = await generateSmartRecommendations(userId);

    if (recommendations.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('smart_recommendations')
        .insert(recommendations)
        .select();

      if (error) {
        console.error('Error saving recommendations:', error);
        return res.status(500).json({ error: 'Failed to save recommendations' });
      }

      res.status(201).json({ recommendations: data });
    } else {
      res.json({ recommendations: [], message: 'No new recommendations generated' });
    }
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 更新推荐状态
router.patch('/recommendations/:id', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'dismissed', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data, error } = await supabase
      .from('smart_recommendations')
      .update({ status })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating recommendation:', error);
      return res.status(500).json({ error: 'Failed to update recommendation' });
    }

    res.json({ recommendation: data });
  } catch (error) {
    console.error('Error in recommendation PATCH:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取趋势分析
router.get('/trends', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { category, period = '30d' } = req.query;

    let dateFrom: string;
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '30d':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '90d':
        dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const trends = await analyzeTrends(userId, category as string, dateFrom);

    res.json({ trends });
  } catch (error) {
    console.error('Error analyzing trends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 辅助函数：为特定类别生成洞察
async function generateInsightsForCategory(userId: string, category: string) {
  const insights = [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    switch (category) {
      case 'records':
        const { data: records } = await supabase
          .from('records')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', thirtyDaysAgo);

        if (records && records.length > 0) {
          // 分析记录频率
          const recordsByDay = records.reduce((acc: Record<string, number>, record) => {
            const day = record.created_at.split('T')[0];
            acc[day] = (acc[day] || 0) + 1;
            return acc;
          }, {});

          const totalRecords = (Object.values(recordsByDay) as number[]).reduce((sum: number, count: number) => sum + count, 0);
          const avgRecordsPerDay = totalRecords / Object.keys(recordsByDay).length;
          
          if (avgRecordsPerDay > 2) {
            insights.push({
              user_id: userId,
              insight_type: 'trend',
              category: 'records',
              title: '记录活跃度很高',
              description: `您最近30天平均每天创建${avgRecordsPerDay.toFixed(1)}条记录，保持了很好的记录习惯！`,
              data: { avgRecordsPerDay, totalRecords: records.length },
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              is_active: true
            });
          }

          // 分析记录类型分布
          const typeDistribution = records.reduce((acc: Record<string, number>, record) => {
            const type = record.type || 'text';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {});

          const mostUsedType = Object.entries(typeDistribution).sort(([,a], [,b]) => (b as number) - (a as number))[0];
          if (mostUsedType) {
            insights.push({
              user_id: userId,
              insight_type: 'pattern',
              category: 'records',
              title: '记录类型偏好',
              description: `您最常使用${mostUsedType[0]}类型记录，占总记录的${((mostUsedType[1] as number) / records.length * 100).toFixed(1)}%`,
              data: typeDistribution,
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              is_active: true
            });
          }
        }
        break;

      case 'health':
        const { data: healthData } = await supabase
          .from('health_data')
          .select('*')
          .eq('user_id', userId)
          .gte('recorded_at', thirtyDaysAgo);

        if (healthData && healthData.length > 0) {
          // 分析健康数据趋势
          const healthByType = healthData.reduce((acc: Record<string, number[]>, item) => {
            if (!acc[item.data_type]) acc[item.data_type] = [];
            if (typeof item.value === 'number') {
              acc[item.data_type].push(item.value);
            }
            return acc;
          }, {});

          Object.entries(healthByType).forEach(([type, values]) => {
            if (Array.isArray(values) && values.length >= 7) {
              const recent = values.slice(-7);
              const earlier = values.slice(0, -7);
              const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
              const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length;
              
              if (recentAvg > earlierAvg * 1.1) {
                insights.push({
                  user_id: userId,
                  insight_type: 'trend',
                  category: 'health',
                  title: `${type}数据呈上升趋势`,
                  description: `您的${type}最近一周平均值比之前提高了${((recentAvg - earlierAvg) / earlierAvg * 100).toFixed(1)}%`,
                  data: { type, recentAvg, earlierAvg, improvement: (recentAvg - earlierAvg) / earlierAvg },
                  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                  is_active: true
                });
              }
            }
          });
        }
        break;

      case 'plans':
        const { data: plans } = await supabase
          .from('plans')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', thirtyDaysAgo);

        if (plans && plans.length > 0) {
          const completedPlans = plans.filter(p => p.status === 'completed').length;
          const completionRate = completedPlans / plans.length;
          
          if (completionRate > 0.8) {
            insights.push({
              user_id: userId,
              insight_type: 'pattern',
              category: 'plans',
              title: '计划执行力强',
              description: `您已完成${completedPlans}个计划，完成率达到${(completionRate * 100).toFixed(1)}%，执行力很强！`,
              data: { completedPlans, totalPlans: plans.length, completionRate },
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              is_active: true
            });
          } else if (completionRate < 0.5) {
            insights.push({
              user_id: userId,
              insight_type: 'recommendation',
              category: 'plans',
              title: '建议优化计划管理',
              description: `您的计划完成率为${(completionRate * 100).toFixed(1)}%，建议将大计划分解为小任务，提高执行效率。`,
              data: { completedPlans, totalPlans: plans.length, completionRate },
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              is_active: true
            });
          }
        }
        break;

      case 'reminders':
        const { data: reminders } = await supabase
          .from('reminders')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', thirtyDaysAgo);

        if (reminders && reminders.length > 0) {
          const completedReminders = reminders.filter(r => r.status === 'completed').length;
          const completionRate = completedReminders / reminders.length;
          
          if (completionRate > 0.8) {
            insights.push({
              user_id: userId,
              insight_type: 'pattern',
              category: 'reminders',
              title: '提醒完成率很高',
              description: `您的提醒完成率达到${(completionRate * 100).toFixed(1)}%，时间管理能力很强！`,
              data: { completedReminders, totalReminders: reminders.length, completionRate },
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              is_active: true
            });
          }
        }
        break;
    }
  } catch (error) {
    console.error(`Error generating insights for ${category}:`, error);
  }

  return insights;
}

// 辅助函数：生成智能推荐
async function generateSmartRecommendations(userId: string) {
  const recommendations = [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // 基于用户记忆生成推荐
    const { data: memories } = await supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', userId)
      .gte('confidence_score', 0.7);

    // 基于健康数据生成推荐
    const { data: healthData } = await supabase
      .from('health_data')
      .select('*')
      .eq('user_id', userId)
      .gte('recorded_at', thirtyDaysAgo)
      .order('recorded_at', { ascending: false })
      .limit(10);

    if (healthData && healthData.length < 5) {
      recommendations.push({
        user_id: userId,
        recommendation_type: 'habit',
        title: '建议增加健康数据记录',
        description: '定期记录健康数据有助于了解身体状况和健康趋势，建议每天记录体重、运动等数据。',
        action_data: { type: 'create_health_record', category: 'health' },
        priority: 3,
        confidence_score: 0.8
      });
    }

    // 基于计划完成情况生成推荐
    const { data: plans } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo);

    if (plans) {
      const overduePlans = plans.filter(p => 
        p.status !== 'completed' && new Date(p.end_date) < new Date()
      );

      if (overduePlans.length > 0) {
        recommendations.push({
          user_id: userId,
          recommendation_type: 'action',
          title: '处理逾期计划',
          description: `您有${overduePlans.length}个计划已逾期，建议重新评估这些计划的优先级和可行性。`,
          action_data: { type: 'review_plans', overdue_count: overduePlans.length },
          priority: 4,
          confidence_score: 0.9
        });
      }
    }

    // 基于记录习惯生成推荐
    const { data: records } = await supabase
      .from('records')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo);

    if (records && records.length > 0) {
      const recordsByDay = records.reduce((acc: Record<string, number>, record) => {
        const day = record.created_at.split('T')[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});

      const avgRecordsPerDay = Object.values(recordsByDay).reduce((sum, count) => sum + count, 0) / Object.keys(recordsByDay).length;
      
      if (avgRecordsPerDay < 1) {
        recommendations.push({
          user_id: userId,
          recommendation_type: 'habit',
          title: '建议增加记录频率',
          description: '定期记录有助于跟踪进展和反思，建议每天至少创建一条记录。',
          action_data: { type: 'increase_recording', current_avg: avgRecordsPerDay },
          priority: 2,
          confidence_score: 0.7
        });
      }
    }

  } catch (error) {
    console.error('Error generating smart recommendations:', error);
  }

  return recommendations;
}

// 辅助函数：分析趋势
async function analyzeTrends(userId: string, category: string, dateFrom: string) {
  const trends: any = {
    category,
    period: dateFrom,
    data: []
  };

  try {
    switch (category) {
      case 'records':
        const { data: records } = await supabase
          .from('records')
          .select('created_at')
          .eq('user_id', userId)
          .gte('created_at', dateFrom)
          .order('created_at', { ascending: true });

        if (records) {
          const dailyCounts = records.reduce((acc: Record<string, number>, record) => {
            const day = record.created_at.split('T')[0];
            acc[day] = (acc[day] || 0) + 1;
            return acc;
          }, {});

          trends.data = Object.entries(dailyCounts).map(([date, count]) => ({
            date,
            value: count,
            type: 'count'
          }));
        }
        break;

      case 'health':
        const { data: healthData } = await supabase
          .from('health_data')
          .select('*')
          .eq('user_id', userId)
          .gte('recorded_at', dateFrom)
          .order('recorded_at', { ascending: true });

        if (healthData) {
          trends.data = healthData.map(item => ({
            date: item.recorded_at.split('T')[0],
            value: item.value,
            type: item.data_type
          }));
        }
        break;

      default:
        trends.data = [];
    }
  } catch (error) {
    console.error('Error analyzing trends:', error);
    trends.error = 'Failed to analyze trends';
  }

  return trends;
}

export default router;