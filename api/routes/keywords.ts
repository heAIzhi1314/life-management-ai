import express from 'express'
import { supabaseAdmin } from '../lib/supabase.js'

const router = express.Router()

// 获取用户的关键词配置
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('keyword_configs')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching keyword configs:', error)
      return res.status(500).json({ error: 'Failed to fetch keyword configs' })
    }

    // 转换数据格式以匹配前端期望的格式
    const formattedData = data.map(config => ({
      id: config.id,
      category: config.category,
      keywords: config.keywords,
      priority: config.priority
    }))

    res.json(formattedData)
  } catch (error) {
    console.error('Error in GET /keywords:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 创建新的关键词配置
router.post('/', async (req, res) => {
  try {
    const { category, keywords, priority = 2 } = req.body

    if (!category || !keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: 'Category and keywords are required' })
    }

    // 检查关键词冲突
    const { data: existingConfigs, error: fetchError } = await supabaseAdmin
      .from('keyword_configs')
      .select('keywords')
      .eq('is_active', true)

    if (fetchError) {
      console.error('Error checking existing keywords:', fetchError)
      return res.status(500).json({ error: 'Failed to check existing keywords' })
    }

    // 检查是否有重复关键词
    const allExistingKeywords = existingConfigs.flatMap(config => config.keywords)
    const conflicts = keywords.filter(keyword => 
      allExistingKeywords.some(existing => 
        existing.toLowerCase() === keyword.toLowerCase()
      )
    )

    if (conflicts.length > 0) {
      return res.status(400).json({ 
        error: 'Keyword conflicts detected', 
        conflicts 
      })
    }

    // 创建新配置
    const { data, error } = await supabaseAdmin
      .from('keyword_configs')
      .insert({
        category,
        keywords,
        priority,
        user_id: '00000000-0000-0000-0000-000000000000' // 临时使用固定用户ID
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating keyword config:', error)
      return res.status(500).json({ error: 'Failed to create keyword config' })
    }

    res.status(201).json({
      id: data.id,
      category: data.category,
      keywords: data.keywords,
      priority: data.priority
    })
  } catch (error) {
    console.error('Error in POST /keywords:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 更新关键词配置
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { category, keywords, priority } = req.body

    if (!category || !keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: 'Category and keywords are required' })
    }

    // 检查关键词冲突（排除当前配置）
    const { data: existingConfigs, error: fetchError } = await supabaseAdmin
      .from('keyword_configs')
      .select('keywords')
      .eq('is_active', true)
      .neq('id', id)

    if (fetchError) {
      console.error('Error checking existing keywords:', fetchError)
      return res.status(500).json({ error: 'Failed to check existing keywords' })
    }

    // 检查是否有重复关键词
    const allExistingKeywords = existingConfigs.flatMap(config => config.keywords)
    const conflicts = keywords.filter(keyword => 
      allExistingKeywords.some(existing => 
        existing.toLowerCase() === keyword.toLowerCase()
      )
    )

    if (conflicts.length > 0) {
      return res.status(400).json({ 
        error: 'Keyword conflicts detected', 
        conflicts 
      })
    }

    // 更新配置
    const { data, error } = await supabaseAdmin
      .from('keyword_configs')
      .update({
        category,
        keywords,
        priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating keyword config:', error)
      return res.status(500).json({ error: 'Failed to update keyword config' })
    }

    if (!data) {
      return res.status(404).json({ error: 'Keyword config not found' })
    }

    res.json({
      id: data.id,
      category: data.category,
      keywords: data.keywords,
      priority: data.priority
    })
  } catch (error) {
    console.error('Error in PUT /keywords:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 删除关键词配置
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // 软删除：设置为非活跃状态
    const { data, error } = await supabaseAdmin
      .from('keyword_configs')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error deleting keyword config:', error)
      return res.status(500).json({ error: 'Failed to delete keyword config' })
    }

    if (!data) {
      return res.status(404).json({ error: 'Keyword config not found' })
    }

    res.json({ message: 'Keyword config deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /keywords:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 批量导入关键词配置
router.post('/import', async (req, res) => {
  try {
    const { configs } = req.body

    if (!Array.isArray(configs) || configs.length === 0) {
      return res.status(400).json({ error: 'Configs array is required' })
    }

    // 验证配置格式
    const isValidConfig = configs.every(config => 
      config.category && 
      Array.isArray(config.keywords) && 
      config.keywords.length > 0
    )

    if (!isValidConfig) {
      return res.status(400).json({ error: 'Invalid config format' })
    }

    // 检查关键词冲突
    const allImportKeywords = configs.flatMap(config => config.keywords)
    const duplicates = allImportKeywords.filter((keyword, index) => 
      allImportKeywords.findIndex(k => k.toLowerCase() === keyword.toLowerCase()) !== index
    )

    if (duplicates.length > 0) {
      return res.status(400).json({ 
        error: 'Duplicate keywords in import data', 
        duplicates: [...new Set(duplicates)] 
      })
    }

    // 清除现有配置（软删除）
    await supabaseAdmin
      .from('keyword_configs')
      .update({ is_active: false })
      .eq('user_id', '00000000-0000-0000-0000-000000000000')

    // 插入新配置
    const insertData = configs.map(config => ({
      category: config.category,
      keywords: config.keywords,
      priority: config.priority || 2,
      user_id: '00000000-0000-0000-0000-000000000000'
    }))

    const { data, error } = await supabaseAdmin
      .from('keyword_configs')
      .insert(insertData)
      .select()

    if (error) {
      console.error('Error importing keyword configs:', error)
      return res.status(500).json({ error: 'Failed to import keyword configs' })
    }

    const formattedData = data.map(config => ({
      id: config.id,
      category: config.category,
      keywords: config.keywords,
      priority: config.priority
    }))

    res.json({ 
      message: 'Keyword configs imported successfully', 
      data: formattedData 
    })
  } catch (error) {
    console.error('Error in POST /keywords/import:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 重置为默认配置
router.post('/reset', async (req, res) => {
  try {
    // 清除现有配置（软删除）
    await supabaseAdmin
      .from('keyword_configs')
      .update({ is_active: false })
      .eq('user_id', '00000000-0000-0000-0000-000000000000')

    // 插入默认配置
    const defaultConfigs = [
      { category: 'record', keywords: ['记录', '记下', '保存', '备忘'], priority: 1 },
      { category: 'reminder', keywords: ['提醒', '提醒我', '别忘了', '记得'], priority: 1 },
      { category: 'plan', keywords: ['计划', '安排', '规划', '打算'], priority: 1 },
      { category: 'health', keywords: ['健康', '体重', '血压', '运动'], priority: 1 },
      { category: 'growth', keywords: ['成长', '学习', '进步', '目标'], priority: 1 }
    ]

    const insertData = defaultConfigs.map(config => ({
      ...config,
      user_id: '00000000-0000-0000-0000-000000000000'
    }))

    const { data, error } = await supabaseAdmin
      .from('keyword_configs')
      .insert(insertData)
      .select()

    if (error) {
      console.error('Error resetting keyword configs:', error)
      return res.status(500).json({ error: 'Failed to reset keyword configs' })
    }

    const formattedData = data.map(config => ({
      id: config.id,
      category: config.category,
      keywords: config.keywords,
      priority: config.priority
    }))

    res.json({ 
      message: 'Keyword configs reset to default successfully', 
      data: formattedData 
    })
  } catch (error) {
    console.error('Error in POST /keywords/reset:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router