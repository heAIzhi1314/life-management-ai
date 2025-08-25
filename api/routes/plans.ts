import express, { Request, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticateToken } from './auth.js'

const router = express.Router()

// 所有路由都需要认证
router.use(authenticateToken)

// 创建计划
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      category = 'personal',
      start_date,
      end_date,
      status = 'active'
    } = req.body
    const userId = req.user.userId

    if (!title) {
      return res.status(400).json({
        success: false,
        error: '计划标题不能为空'
      })
    }

    const { data: plan, error } = await supabaseAdmin
      .from('plans')
      .insert({
        user_id: userId,
        title,
        description,
        category,
        start_date,
        end_date,
        status,
        progress: 0
      })
      .select()
      .single()

    if (error) {
      console.error('创建计划失败:', error)
      return res.status(500).json({
        success: false,
        error: '创建计划失败'
      })
    }

    res.status(201).json({
      success: true,
      message: '计划创建成功',
      plan
    })
  } catch (error) {
    console.error('创建计划错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 获取用户的所有计划
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId
    const { page = 1, limit = 20, category, status } = req.query

    let query = supabaseAdmin
      .from('plans')
      .select(`
        *,
        tasks:tasks(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // 按分类筛选
    if (category) {
      query = query.eq('category', category)
    }

    // 按状态筛选
    if (status) {
      query = query.eq('status', status)
    }

    // 分页
    const offset = (Number(page) - 1) * Number(limit)
    query = query.range(offset, offset + Number(limit) - 1)

    const { data: plans, error, count } = await query

    if (error) {
      console.error('获取计划失败:', error)
      return res.status(500).json({
        success: false,
        error: '获取计划失败'
      })
    }

    res.json({
      success: true,
      plans,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0
      }
    })
  } catch (error) {
    console.error('获取计划错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 获取单个计划（包含任务）
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const { data: plan, error } = await supabaseAdmin
      .from('plans')
      .select(`
        *,
        tasks:tasks(*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !plan) {
      return res.status(404).json({
        success: false,
        error: '计划不存在'
      })
    }

    res.json({
      success: true,
      plan
    })
  } catch (error) {
    console.error('获取计划错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 更新计划
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      title,
      description,
      category,
      start_date,
      end_date,
      status,
      progress
    } = req.body
    const userId = req.user.userId

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (start_date !== undefined) updateData.start_date = start_date
    if (end_date !== undefined) updateData.end_date = end_date
    if (status !== undefined) updateData.status = status
    if (progress !== undefined) updateData.progress = Math.max(0, Math.min(100, progress))

    const { data: plan, error } = await supabaseAdmin
      .from('plans')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !plan) {
      return res.status(404).json({
        success: false,
        error: '计划不存在或更新失败'
      })
    }

    res.json({
      success: true,
      message: '计划更新成功',
      plan
    })
  } catch (error) {
    console.error('更新计划错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 删除计划
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const { error } = await supabaseAdmin
      .from('plans')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('删除计划失败:', error)
      return res.status(500).json({
        success: false,
        error: '删除计划失败'
      })
    }

    res.json({
      success: true,
      message: '计划删除成功'
    })
  } catch (error) {
    console.error('删除计划错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 为计划添加任务
router.post('/:id/tasks', async (req: Request, res: Response) => {
  try {
    const { id: planId } = req.params
    const { title, description, due_date, order_index = 0 } = req.body
    const userId = req.user.userId

    if (!title) {
      return res.status(400).json({
        success: false,
        error: '任务标题不能为空'
      })
    }

    // 验证计划是否属于当前用户
    const { data: plan } = await supabaseAdmin
      .from('plans')
      .select('id')
      .eq('id', planId)
      .eq('user_id', userId)
      .single()

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: '计划不存在'
      })
    }

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        plan_id: planId,
        title,
        description,
        due_date,
        order_index,
        is_completed: false
      })
      .select()
      .single()

    if (error) {
      console.error('创建任务失败:', error)
      return res.status(500).json({
        success: false,
        error: '创建任务失败'
      })
    }

    res.status(201).json({
      success: true,
      message: '任务创建成功',
      task
    })
  } catch (error) {
    console.error('创建任务错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 更新任务
router.put('/:planId/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const { planId, taskId } = req.params
    const { title, description, is_completed, due_date, order_index } = req.body
    const userId = req.user.userId

    // 验证计划是否属于当前用户
    const { data: plan } = await supabaseAdmin
      .from('plans')
      .select('id')
      .eq('id', planId)
      .eq('user_id', userId)
      .single()

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: '计划不存在'
      })
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (is_completed !== undefined) updateData.is_completed = is_completed
    if (due_date !== undefined) updateData.due_date = due_date
    if (order_index !== undefined) updateData.order_index = order_index

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('plan_id', planId)
      .select()
      .single()

    if (error || !task) {
      return res.status(404).json({
        success: false,
        error: '任务不存在或更新失败'
      })
    }

    // 如果任务完成状态改变，更新计划进度
    if (is_completed !== undefined) {
      await updatePlanProgress(planId)
    }

    res.json({
      success: true,
      message: '任务更新成功',
      task
    })
  } catch (error) {
    console.error('更新任务错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 删除任务
router.delete('/:planId/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const { planId, taskId } = req.params
    const userId = req.user.userId

    // 验证计划是否属于当前用户
    const { data: plan } = await supabaseAdmin
      .from('plans')
      .select('id')
      .eq('id', planId)
      .eq('user_id', userId)
      .single()

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: '计划不存在'
      })
    }

    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('plan_id', planId)

    if (error) {
      console.error('删除任务失败:', error)
      return res.status(500).json({
        success: false,
        error: '删除任务失败'
      })
    }

    // 更新计划进度
    await updatePlanProgress(planId)

    res.json({
      success: true,
      message: '任务删除成功'
    })
  } catch (error) {
    console.error('删除任务错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 获取计划统计信息
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId

    // 获取总计划数
    const { count: totalPlans } = await supabaseAdmin
      .from('plans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // 获取活跃计划数
    const { count: activePlans } = await supabaseAdmin
      .from('plans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active')

    // 获取已完成计划数
    const { count: completedPlans } = await supabaseAdmin
      .from('plans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')

    // 获取各分类计划数
    const { data: categoryStats } = await supabaseAdmin
      .from('plans')
      .select('category')
      .eq('user_id', userId)

    const categoryCounts = categoryStats?.reduce((acc: any, plan: any) => {
      acc[plan.category] = (acc[plan.category] || 0) + 1
      return acc
    }, {}) || {}

    res.json({
      success: true,
      stats: {
        totalPlans: totalPlans || 0,
        activePlans: activePlans || 0,
        completedPlans: completedPlans || 0,
        categoryStats: categoryCounts
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

// 辅助函数：更新计划进度
async function updatePlanProgress(planId: string) {
  try {
    const { data: tasks } = await supabaseAdmin
      .from('tasks')
      .select('is_completed')
      .eq('plan_id', planId)

    if (tasks && tasks.length > 0) {
      const completedTasks = tasks.filter(task => task.is_completed).length
      const progress = Math.round((completedTasks / tasks.length) * 100)

      await supabaseAdmin
        .from('plans')
        .update({ progress })
        .eq('id', planId)
    }
  } catch (error) {
    console.error('更新计划进度失败:', error)
  }
}

export default router