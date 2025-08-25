import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// 获取用户数据概览
router.get('/overview', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 并行查询各种数据
    const [recordsResult, remindersResult, plansResult, healthResult, conversationsResult] = await Promise.all([
      supabase.from('records').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('reminders').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('plans').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('health_data').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('user_id', userId)
    ]);

    const overview = {
      records: recordsResult.count || 0,
      reminders: remindersResult.count || 0,
      plans: plansResult.count || 0,
      healthData: healthResult.count || 0,
      conversations: conversationsResult.count || 0
    };

    res.json({ overview });
  } catch (error) {
    console.error('Error fetching data overview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 查询记录数据
router.get('/records', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { category, dateFrom, dateTo, limit = 100, search } = req.query;

    let query = supabase
      .from('records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (category) {
      query = query.eq('category', category);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error querying records:', error);
      return res.status(500).json({ error: 'Failed to query records' });
    }

    res.json({ records: data || [] });
  } catch (error) {
    console.error('Error in records query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 查询提醒数据
router.get('/reminders', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status, dateFrom, dateTo, limit = 100 } = req.query;

    let query = supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('remind_time', { ascending: true })
      .limit(Number(limit));

    if (status) {
      query = query.eq('status', status);
    }

    if (dateFrom) {
      query = query.gte('remind_time', dateFrom);
    }

    if (dateTo) {
      query = query.lte('remind_time', dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error querying reminders:', error);
      return res.status(500).json({ error: 'Failed to query reminders' });
    }

    res.json({ reminders: data || [] });
  } catch (error) {
    console.error('Error in reminders query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 查询计划数据
router.get('/plans', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { category, status, dateFrom, dateTo, limit = 100 } = req.query;

    let query = supabase
      .from('plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (category) {
      query = query.eq('category', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (dateFrom) {
      query = query.gte('start_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('end_date', dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error querying plans:', error);
      return res.status(500).json({ error: 'Failed to query plans' });
    }

    res.json({ plans: data || [] });
  } catch (error) {
    console.error('Error in plans query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 查询健康数据
router.get('/health', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type, dateFrom, dateTo, limit = 100 } = req.query;

    let query = supabase
      .from('health_data')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(Number(limit));

    if (type) {
      query = query.eq('type', type);
    }

    if (dateFrom) {
      query = query.gte('recorded_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('recorded_at', dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error querying health data:', error);
      return res.status(500).json({ error: 'Failed to query health data' });
    }

    res.json({ healthData: data || [] });
  } catch (error) {
    console.error('Error in health query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取数据统计
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { period = '7d' } = req.query; // 7d, 30d, 90d, 1y

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
      case '1y':
        dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    // 并行查询各种统计数据
    const [recordsStats, remindersStats, plansStats, healthStats] = await Promise.all([
      // 记录统计
      supabase
        .from('records')
        .select('category, created_at')
        .eq('user_id', userId)
        .gte('created_at', dateFrom),
      
      // 提醒统计
      supabase
        .from('reminders')
        .select('status, remind_time')
        .eq('user_id', userId)
        .gte('remind_time', dateFrom),
      
      // 计划统计
      supabase
        .from('plans')
        .select('category, status, created_at')
        .eq('user_id', userId)
        .gte('created_at', dateFrom),
      
      // 健康数据统计
      supabase
        .from('health_data')
        .select('type, value, recorded_at')
        .eq('user_id', userId)
        .gte('recorded_at', dateFrom)
    ]);

    // 处理记录统计
    const recordsByCategory = recordsStats.data?.reduce((acc: Record<string, number>, record) => {
      acc[record.category] = (acc[record.category] || 0) + 1;
      return acc;
    }, {}) || {};

    // 处理提醒统计
    const remindersByStatus = remindersStats.data?.reduce((acc: Record<string, number>, reminder) => {
      acc[reminder.status] = (acc[reminder.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // 处理计划统计
    const plansByCategory = plansStats.data?.reduce((acc: Record<string, number>, plan) => {
      acc[plan.category] = (acc[plan.category] || 0) + 1;
      return acc;
    }, {}) || {};

    const plansByStatus = plansStats.data?.reduce((acc: Record<string, number>, plan) => {
      acc[plan.status] = (acc[plan.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // 处理健康数据统计
    const healthByType = healthStats.data?.reduce((acc: Record<string, { count: number, avgValue: number }>, health) => {
      if (!acc[health.type]) {
        acc[health.type] = { count: 0, avgValue: 0 };
      }
      acc[health.type].count += 1;
      acc[health.type].avgValue = (acc[health.type].avgValue * (acc[health.type].count - 1) + health.value) / acc[health.type].count;
      return acc;
    }, {}) || {};

    const stats = {
      period,
      records: {
        total: recordsStats.data?.length || 0,
        byCategory: recordsByCategory
      },
      reminders: {
        total: remindersStats.data?.length || 0,
        byStatus: remindersByStatus
      },
      plans: {
        total: plansStats.data?.length || 0,
        byCategory: plansByCategory,
        byStatus: plansByStatus
      },
      health: {
        total: healthStats.data?.length || 0,
        byType: healthByType
      }
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching data stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 智能数据分析
router.get('/insights', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 获取最近30天的数据进行分析
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [records, reminders, plans, health] = await Promise.all([
      supabase.from('records').select('*').eq('user_id', userId).gte('created_at', thirtyDaysAgo),
      supabase.from('reminders').select('*').eq('user_id', userId).gte('created_at', thirtyDaysAgo),
      supabase.from('plans').select('*').eq('user_id', userId).gte('created_at', thirtyDaysAgo),
      supabase.from('health_data').select('*').eq('user_id', userId).gte('recorded_at', thirtyDaysAgo)
    ]);

    const insights = [];

    // 分析记录趋势
    if (records.data && records.data.length > 0) {
      const recordsByDay = records.data.reduce((acc: Record<string, number>, record) => {
        const day = record.created_at.split('T')[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});

      const totalRecords = (Object.values(recordsByDay) as number[]).reduce((sum: number, count: number) => sum + count, 0);
       const avgRecordsPerDay = totalRecords / Object.keys(recordsByDay).length;
      
      if (avgRecordsPerDay > 2) {
        insights.push({
          type: 'trend',
          category: 'records',
          title: '记录活跃度很高',
          description: `您最近30天平均每天创建${avgRecordsPerDay.toFixed(1)}条记录，保持了很好的记录习惯！`,
          confidence: 0.9
        });
      }
    }

    // 分析提醒完成率
    if (reminders.data && reminders.data.length > 0) {
      const completedReminders = reminders.data.filter(r => r.status === 'completed').length;
      const completionRate = completedReminders / reminders.data.length;
      
      if (completionRate > 0.8) {
        insights.push({
          type: 'pattern',
          category: 'reminders',
          title: '提醒完成率很高',
          description: `您的提醒完成率达到${(completionRate * 100).toFixed(1)}%，时间管理能力很强！`,
          confidence: 0.85
        });
      } else if (completionRate < 0.5) {
        insights.push({
          type: 'recommendation',
          category: 'reminders',
          title: '建议优化提醒设置',
          description: `您的提醒完成率为${(completionRate * 100).toFixed(1)}%，建议减少提醒数量或调整提醒时间。`,
          confidence: 0.75
        });
      }
    }

    // 分析计划执行情况
    if (plans.data && plans.data.length > 0) {
      const completedPlans = plans.data.filter(p => p.status === 'completed').length;
      const inProgressPlans = plans.data.filter(p => p.status === 'in_progress').length;
      
      if (completedPlans > inProgressPlans) {
        insights.push({
          type: 'pattern',
          category: 'plans',
          title: '计划执行力强',
          description: `您已完成${completedPlans}个计划，执行力很强！继续保持这个节奏。`,
          confidence: 0.8
        });
      }
    }

    // 分析健康数据趋势
    if (health.data && health.data.length > 0) {
      const healthByType = health.data.reduce((acc: Record<string, number[]>, item) => {
        if (!acc[item.type]) acc[item.type] = [];
        acc[item.type].push(item.value);
        return acc;
      }, {});

      Object.entries(healthByType).forEach(([type, values]) => {
        if (Array.isArray(values) && values.length >= 7) { // 至少7个数据点
          const recent = values.slice(-7);
          const earlier = values.slice(0, -7);
          const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
          const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length;
          
          if (recentAvg > earlierAvg * 1.1) {
            insights.push({
              type: 'trend',
              category: 'health',
              title: `${type}数据呈上升趋势`,
              description: `您的${type}最近一周平均值比之前提高了${((recentAvg - earlierAvg) / earlierAvg * 100).toFixed(1)}%`,
              confidence: 0.7
            });
          }
        }
      });
    }

    res.json({ insights });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;