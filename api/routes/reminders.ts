import express, { Request, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticateToken } from './auth.js'

const router = express.Router()

// 所有路由都需要认证
router.use(authenticateToken)

// 创建提醒
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      remind_time,
      priority = 'medium',
      location_trigger,
      repeat_pattern
    } = req.body
    const userId = req.user.userId

    if (!title) {
      return res.status(400).json({
        success: false,
        error: '提醒标题不能为空'
      })
    }

    const { data: reminder, error } = await supabaseAdmin
      .from('reminders')
      .insert({
        user_id: userId,
        title,
        description,
        remind_time,
        priority,
        location_trigger,
        repeat_pattern
      })
      .select()
      .single()

    if (error) {
      console.error('创建提醒失败:', error)
      return res.status(500).json({
        success: false,
        error: '创建提醒失败'
      })
    }

    res.status(201).json({
      success: true,
      message: '提醒创建成功',
      reminder
    })
  } catch (error) {
    console.error('创建提醒错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 获取用户的所有提醒
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId
    const { page = 1, limit = 20, priority, completed, upcoming } = req.query

    let query = supabaseAdmin
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('remind_time', { ascending: true })

    // 按优先级筛选
    if (priority) {
      query = query.eq('priority', priority)
    }

    // 按完成状态筛选
    if (completed !== undefined) {
      query = query.eq('is_completed', completed === 'true')
    }

    // 只显示即将到来的提醒
    if (upcoming === 'true') {
      const now = new Date().toISOString()
      query = query.gte('remind_time', now).eq('is_completed', false)
    }

    // 分页
    const offset = (Number(page) - 1) * Number(limit)
    query = query.range(offset, offset + Number(limit) - 1)

    const { data: reminders, error, count } = await query

    if (error) {
      console.error('获取提醒失败:', error)
      return res.status(500).json({
        success: false,
        error: '获取提醒失败'
      })
    }

    res.json({
      success: true,
      reminders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0
      }
    })
  } catch (error) {
    console.error('获取提醒错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 获取今日提醒
router.get('/today', async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

    const { data: reminders, error } = await supabaseAdmin
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .gte('remind_time', startOfDay)
      .lte('remind_time', endOfDay)
      .order('remind_time', { ascending: true })

    if (error) {
      console.error('获取今日提醒失败:', error)
      return res.status(500).json({
        success: false,
        error: '获取今日提醒失败'
      })
    }

    res.json({
      success: true,
      reminders
    })
  } catch (error) {
    console.error('获取今日提醒错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 获取单个提醒
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const { data: reminder, error } = await supabaseAdmin
      .from('reminders')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !reminder) {
      return res.status(404).json({
        success: false,
        error: '提醒不存在'
      })
    }

    res.json({
      success: true,
      reminder
    })
  } catch (error) {
    console.error('获取提醒错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 更新提醒
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      title,
      description,
      remind_time,
      priority,
      is_completed,
      location_trigger,
      repeat_pattern
    } = req.body
    const userId = req.user.userId

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (remind_time !== undefined) updateData.remind_time = remind_time
    if (priority !== undefined) updateData.priority = priority
    if (is_completed !== undefined) updateData.is_completed = is_completed
    if (location_trigger !== undefined) updateData.location_trigger = location_trigger
    if (repeat_pattern !== undefined) updateData.repeat_pattern = repeat_pattern

    const { data: reminder, error } = await supabaseAdmin
      .from('reminders')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !reminder) {
      return res.status(404).json({
        success: false,
        error: '提醒不存在或更新失败'
      })
    }

    res.json({
      success: true,
      message: '提醒更新成功',
      reminder
    })
  } catch (error) {
    console.error('更新提醒错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 标记提醒为已完成
router.patch('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const { data: reminder, error } = await supabaseAdmin
      .from('reminders')
      .update({ is_completed: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !reminder) {
      return res.status(404).json({
        success: false,
        error: '提醒不存在'
      })
    }

    res.json({
      success: true,
      message: '提醒已标记为完成',
      reminder
    })
  } catch (error) {
    console.error('完成提醒错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 删除提醒
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const { error } = await supabaseAdmin
      .from('reminders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('删除提醒失败:', error)
      return res.status(500).json({
        success: false,
        error: '删除提醒失败'
      })
    }

    res.json({
      success: true,
      message: '提醒删除成功'
    })
  } catch (error) {
    console.error('删除提醒错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 获取提醒统计信息
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId
    const now = new Date().toISOString()

    // 获取总提醒数
    const { count: totalReminders } = await supabaseAdmin
      .from('reminders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // 获取待完成提醒数
    const { count: pendingReminders } = await supabaseAdmin
      .from('reminders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', false)

    // 获取过期提醒数
    const { count: overdueReminders } = await supabaseAdmin
      .from('reminders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', false)
      .lt('remind_time', now)

    // 获取各优先级提醒数
    const { data: priorityStats } = await supabaseAdmin
      .from('reminders')
      .select('priority')
      .eq('user_id', userId)
      .eq('is_completed', false)

    const priorityCounts = priorityStats?.reduce((acc: any, reminder: any) => {
      acc[reminder.priority] = (acc[reminder.priority] || 0) + 1
      return acc
    }, {}) || {}

    res.json({
      success: true,
      stats: {
        totalReminders: totalReminders || 0,
        pendingReminders: pendingReminders || 0,
        overdueReminders: overdueReminders || 0,
        priorityStats: priorityCounts
      }
    })
  } catch (error) {
    console.error('获取统计信息错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

export default router