import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// 获取用户的对话历史
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { page = 1, limit = 20, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (search) {
      query = query.or(`message.ilike.%${search}%,response.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching conversations:', error);
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }

    res.json({ conversations: data || [] });
  } catch (error) {
    console.error('Error in conversations GET:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 保存新的对话记录
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { message, response, intent, actions, context } = req.body;

    if (!message || !response) {
      return res.status(400).json({ error: 'Message and response are required' });
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        message,
        response,
        intent: intent || null,
        actions: actions || [],
        context: context || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving conversation:', error);
      return res.status(500).json({ error: 'Failed to save conversation' });
    }

    res.status(201).json({ conversation: data });
  } catch (error) {
    console.error('Error in conversations POST:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取对话统计信息
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 获取总对话数
    const { count: totalConversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 获取今日对话数
    const today = new Date().toISOString().split('T')[0];
    const { count: todayConversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    // 获取最常用的意图
    const { data: intentStats } = await supabase
      .from('conversations')
      .select('intent')
      .eq('user_id', userId)
      .not('intent', 'is', null);

    const intentCounts = intentStats?.reduce((acc: Record<string, number>, item) => {
      if (item.intent) {
        acc[item.intent] = (acc[item.intent] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    const topIntents = Object.entries(intentCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([intent, count]) => ({ intent, count }));

    res.json({
      totalConversations: totalConversations || 0,
      todayConversations: todayConversations || 0,
      topIntents
    });
  } catch (error) {
    console.error('Error in conversations stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 搜索对话历史
router.get('/search', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { q, intent, dateFrom, dateTo, limit = 50 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let query = supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .or(`message.ilike.%${q}%,response.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (intent) {
      query = query.eq('intent', intent);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching conversations:', error);
      return res.status(500).json({ error: 'Failed to search conversations' });
    }

    res.json({ conversations: data || [] });
  } catch (error) {
    console.error('Error in conversations search:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 删除对话记录
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting conversation:', error);
      return res.status(500).json({ error: 'Failed to delete conversation' });
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error in conversations DELETE:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;