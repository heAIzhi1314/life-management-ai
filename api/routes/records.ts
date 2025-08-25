import express, { Request, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticateToken } from './auth.js'

const router = express.Router()

// 所有路由都需要认证
router.use(authenticateToken)

// 创建记录
router.post('/', async (req: Request, res: Response) => {
  try {
    const { content, type = 'text', tags = [] } = req.body
    const userId = req.user.userId

    if (!content) {
      return res.status(400).json({
        success: false,
        error: '记录内容不能为空'
      })
    }

    const { data: record, error } = await supabaseAdmin
      .from('records')
      .insert({
        user_id: userId,
        content,
        type,
        tags
      })
      .select()
      .single()

    if (error) {
      console.error('创建记录失败:', error)
      return res.status(500).json({
        success: false,
        error: '创建记录失败'
      })
    }

    res.status(201).json({
      success: true,
      message: '记录创建成功',
      record
    })
  } catch (error) {
    console.error('创建记录错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 获取用户的所有记录
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId
    const { page = 1, limit = 20, type, search } = req.query

    let query = supabaseAdmin
      .from('records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // 按类型筛选
    if (type) {
      query = query.eq('type', type)
    }

    // 搜索功能
    if (search) {
      query = query.ilike('content', `%${search}%`)
    }

    // 分页
    const offset = (Number(page) - 1) * Number(limit)
    query = query.range(offset, offset + Number(limit) - 1)

    const { data: records, error, count } = await query

    if (error) {
      console.error('获取记录失败:', error)
      return res.status(500).json({
        success: false,
        error: '获取记录失败'
      })
    }

    res.json({
      success: true,
      records,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0
      }
    })
  } catch (error) {
    console.error('获取记录错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 获取单个记录
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const { data: record, error } = await supabaseAdmin
      .from('records')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !record) {
      return res.status(404).json({
        success: false,
        error: '记录不存在'
      })
    }

    res.json({
      success: true,
      record
    })
  } catch (error) {
    console.error('获取记录错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 更新记录
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { content, type, tags } = req.body
    const userId = req.user.userId

    const updateData: any = { updated_at: new Date().toISOString() }
    if (content !== undefined) updateData.content = content
    if (type !== undefined) updateData.type = type
    if (tags !== undefined) updateData.tags = tags

    const { data: record, error } = await supabaseAdmin
      .from('records')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !record) {
      return res.status(404).json({
        success: false,
        error: '记录不存在或更新失败'
      })
    }

    res.json({
      success: true,
      message: '记录更新成功',
      record
    })
  } catch (error) {
    console.error('更新记录错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 删除记录
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const { error } = await supabaseAdmin
      .from('records')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('删除记录失败:', error)
      return res.status(500).json({
        success: false,
        error: '删除记录失败'
      })
    }

    res.json({
      success: true,
      message: '记录删除成功'
    })
  } catch (error) {
    console.error('删除记录错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 获取记录统计信息
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId

    // 获取总记录数
    const { count: totalRecords } = await supabaseAdmin
      .from('records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // 获取今日记录数
    const today = new Date().toISOString().split('T')[0]
    const { count: todayRecords } = await supabaseAdmin
      .from('records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today)

    // 获取各类型记录数
    const { data: typeStats } = await supabaseAdmin
      .from('records')
      .select('type')
      .eq('user_id', userId)

    const typeCounts = typeStats?.reduce((acc: any, record: any) => {
      acc[record.type] = (acc[record.type] || 0) + 1
      return acc
    }, {}) || {}

    res.json({
      success: true,
      stats: {
        totalRecords: totalRecords || 0,
        todayRecords: todayRecords || 0,
        typeStats: typeCounts
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