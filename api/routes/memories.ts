import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// 获取用户记忆
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type, key } = req.query;

    let query = supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (type) {
      query = query.eq('memory_type', type);
    }

    if (key) {
      query = query.eq('key', key);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching memories:', error);
      return res.status(500).json({ error: 'Failed to fetch memories' });
    }

    res.json({ memories: data || [] });
  } catch (error) {
    console.error('Error in memories GET:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 保存或更新用户记忆
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { memory_type, key, value, confidence_score = 1.0, source = 'conversation' } = req.body;

    if (!memory_type || !key || value === undefined) {
      return res.status(400).json({ error: 'Memory type, key, and value are required' });
    }

    // 尝试更新现有记忆
    const { data: existingMemory } = await supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', userId)
      .eq('memory_type', memory_type)
      .eq('key', key)
      .single();

    let result;
    if (existingMemory) {
      // 更新现有记忆
      const { data, error } = await supabase
        .from('user_memories')
        .update({
          value,
          confidence_score,
          source,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingMemory.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating memory:', error);
        return res.status(500).json({ error: 'Failed to update memory' });
      }
      result = data;
    } else {
      // 创建新记忆
      const { data, error } = await supabase
        .from('user_memories')
        .insert({
          user_id: userId,
          memory_type,
          key,
          value,
          confidence_score,
          source
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating memory:', error);
        return res.status(500).json({ error: 'Failed to create memory' });
      }
      result = data;
    }

    res.status(201).json({ memory: result });
  } catch (error) {
    console.error('Error in memories POST:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 批量保存记忆
router.post('/batch', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { memories } = req.body;

    if (!Array.isArray(memories) || memories.length === 0) {
      return res.status(400).json({ error: 'Memories array is required' });
    }

    const memoriesToInsert = memories.map(memory => ({
      user_id: userId,
      memory_type: memory.memory_type,
      key: memory.key,
      value: memory.value,
      confidence_score: memory.confidence_score || 1.0,
      source: memory.source || 'conversation'
    }));

    const { data, error } = await supabase
      .from('user_memories')
      .upsert(memoriesToInsert, {
        onConflict: 'user_id,memory_type,key',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error('Error batch saving memories:', error);
      return res.status(500).json({ error: 'Failed to save memories' });
    }

    res.status(201).json({ memories: data });
  } catch (error) {
    console.error('Error in memories batch POST:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取用户偏好摘要
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: memories, error } = await supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', userId)
      .gte('confidence_score', 0.7); // 只获取高置信度的记忆

    if (error) {
      console.error('Error fetching user profile:', error);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    // 按类型组织记忆
    const profile = {
      preferences: {},
      habits: {},
      goals: {},
      context: {}
    };

    memories?.forEach(memory => {
      const category = memory.memory_type;
      if (profile[category as keyof typeof profile]) {
        (profile[category as keyof typeof profile] as any)[memory.key] = {
          value: memory.value,
          confidence: memory.confidence_score,
          source: memory.source,
          updated_at: memory.updated_at
        };
      }
    });

    res.json({ profile });
  } catch (error) {
    console.error('Error in memories profile GET:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 删除记忆
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('user_memories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting memory:', error);
      return res.status(500).json({ error: 'Failed to delete memory' });
    }

    res.json({ message: 'Memory deleted successfully' });
  } catch (error) {
    console.error('Error in memories DELETE:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 清除特定类型的记忆
router.delete('/type/:type', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type } = req.params;

    const { error } = await supabase
      .from('user_memories')
      .delete()
      .eq('user_id', userId)
      .eq('memory_type', type);

    if (error) {
      console.error('Error clearing memories:', error);
      return res.status(500).json({ error: 'Failed to clear memories' });
    }

    res.json({ message: `${type} memories cleared successfully` });
  } catch (error) {
    console.error('Error in memories type DELETE:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;