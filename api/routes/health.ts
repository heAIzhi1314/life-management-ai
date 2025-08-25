import express, { Request, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticateToken } from './auth.js'

const router = express.Router()

// 所有路由都需要认证
router.use(authenticateToken)

// 记录运动数据
router.post('/exercise', async (req: Request, res: Response) => {
  try {
    const { type, duration, distance, calories, notes } = req.body
    const userId = req.user.userId
    const recordDate = req.body.record_date || new Date().toISOString().split('T')[0]

    if (!type || !duration) {
      return res.status(400).json({
        success: false,
        error: '运动类型和时长不能为空'
      })
    }

    const exerciseData = {
      type,
      duration,
      distance: distance || null,
      calories: calories || null,
      notes: notes || null
    }

    const { data: healthData, error } = await supabaseAdmin
      .from('health_data')
      .insert({
        user_id: userId,
        data_type: 'exercise',
        data_value: exerciseData,
        record_date: recordDate
      })
      .select()
      .single()

    if (error) {
      console.error('记录运动数据失败:', error)
      return res.status(500).json({
        success: false,
        error: '记录运动数据失败'
      })
    }

    res.status(201).json({
      success: true,
      message: '运动数据记录成功',
      data: healthData
    })
  } catch (error) {
    console.error('记录运动数据错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 记录睡眠数据
router.post('/sleep', async (req: Request, res: Response) => {
  try {
    const { bedtime, wake_time, duration, quality, deep_sleep, light_sleep, rem_sleep, notes } = req.body
    const userId = req.user.userId
    const recordDate = req.body.record_date || new Date().toISOString().split('T')[0]

    if (!bedtime || !wake_time || !duration) {
      return res.status(400).json({
        success: false,
        error: '就寝时间、起床时间和睡眠时长不能为空'
      })
    }

    const sleepData = {
      bedtime,
      wake_time,
      duration,
      quality: quality || null,
      deep_sleep: deep_sleep || null,
      light_sleep: light_sleep || null,
      rem_sleep: rem_sleep || null,
      notes: notes || null
    }

    const { data: healthData, error } = await supabaseAdmin
      .from('health_data')
      .insert({
        user_id: userId,
        data_type: 'sleep',
        data_value: sleepData,
        record_date: recordDate
      })
      .select()
      .single()

    if (error) {
      console.error('记录睡眠数据失败:', error)
      return res.status(500).json({
        success: false,
        error: '记录睡眠数据失败'
      })
    }

    res.status(201).json({
      success: true,
      message: '睡眠数据记录成功',
      data: healthData
    })
  } catch (error) {
    console.error('记录睡眠数据错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 记录营养数据
router.post('/nutrition', async (req: Request, res: Response) => {
  try {
    const { meal_type, foods, total_calories, protein, carbs, fat, fiber, notes } = req.body
    const userId = req.user.userId
    const recordDate = req.body.record_date || new Date().toISOString().split('T')[0]

    if (!meal_type || !foods) {
      return res.status(400).json({
        success: false,
        error: '餐次类型和食物信息不能为空'
      })
    }

    const nutritionData = {
      meal_type,
      foods,
      total_calories: total_calories || null,
      protein: protein || null,
      carbs: carbs || null,
      fat: fat || null,
      fiber: fiber || null,
      notes: notes || null
    }

    const { data: healthData, error } = await supabaseAdmin
      .from('health_data')
      .insert({
        user_id: userId,
        data_type: 'nutrition',
        data_value: nutritionData,
        record_date: recordDate
      })
      .select()
      .single()

    if (error) {
      console.error('记录营养数据失败:', error)
      return res.status(500).json({
        success: false,
        error: '记录营养数据失败'
      })
    }

    res.status(201).json({
      success: true,
      message: '营养数据记录成功',
      data: healthData
    })
  } catch (error) {
    console.error('记录营养数据错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 记录体重数据
router.post('/weight', async (req: Request, res: Response) => {
  try {
    const { weight, body_fat, muscle_mass, bmi, notes } = req.body
    const userId = req.user.userId
    const recordDate = req.body.record_date || new Date().toISOString().split('T')[0]

    if (!weight) {
      return res.status(400).json({
        success: false,
        error: '体重数据不能为空'
      })
    }

    const weightData = {
      weight,
      body_fat: body_fat || null,
      muscle_mass: muscle_mass || null,
      bmi: bmi || null,
      notes: notes || null
    }

    const { data: healthData, error } = await supabaseAdmin
      .from('health_data')
      .insert({
        user_id: userId,
        data_type: 'weight',
        data_value: weightData,
        record_date: recordDate
      })
      .select()
      .single()

    if (error) {
      console.error('记录体重数据失败:', error)
      return res.status(500).json({
        success: false,
        error: '记录体重数据失败'
      })
    }

    res.status(201).json({
      success: true,
      message: '体重数据记录成功',
      data: healthData
    })
  } catch (error) {
    console.error('记录体重数据错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 记录血压数据
router.post('/blood-pressure', async (req: Request, res: Response) => {
  try {
    const { systolic, diastolic, pulse, notes } = req.body
    const userId = req.user.userId
    const recordDate = req.body.record_date || new Date().toISOString().split('T')[0]

    if (!systolic || !diastolic) {
      return res.status(400).json({
        success: false,
        error: '收缩压和舒张压不能为空'
      })
    }

    const bloodPressureData = {
      systolic,
      diastolic,
      pulse: pulse || null,
      notes: notes || null
    }

    const { data: healthData, error } = await supabaseAdmin
      .from('health_data')
      .insert({
        user_id: userId,
        data_type: 'blood_pressure',
        data_value: bloodPressureData,
        record_date: recordDate
      })
      .select()
      .single()

    if (error) {
      console.error('记录血压数据失败:', error)
      return res.status(500).json({
        success: false,
        error: '记录血压数据失败'
      })
    }

    res.status(201).json({
      success: true,
      message: '血压数据记录成功',
      data: healthData
    })
  } catch (error) {
    console.error('记录血压数据错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 获取健康数据
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId
    const { data_type, start_date, end_date, page = 1, limit = 20 } = req.query

    let query = supabaseAdmin
      .from('health_data')
      .select('*')
      .eq('user_id', userId)
      .order('record_date', { ascending: false })

    // 按数据类型筛选
    if (data_type) {
      query = query.eq('data_type', data_type)
    }

    // 按日期范围筛选
    if (start_date) {
      query = query.gte('record_date', start_date)
    }
    if (end_date) {
      query = query.lte('record_date', end_date)
    }

    // 分页
    const offset = (Number(page) - 1) * Number(limit)
    query = query.range(offset, offset + Number(limit) - 1)

    const { data: healthData, error, count } = await query

    if (error) {
      console.error('获取健康数据失败:', error)
      return res.status(500).json({
        success: false,
        error: '获取健康数据失败'
      })
    }

    res.json({
      success: true,
      data: healthData,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0
      }
    })
  } catch (error) {
    console.error('获取健康数据错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 获取健康数据摘要
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId
    const { period = '7d' } = req.query

    // 计算日期范围
    const endDate = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      default:
        startDate.setDate(endDate.getDate() - 7)
    }

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // 获取各类型健康数据
    const { data: healthData, error } = await supabaseAdmin
      .from('health_data')
      .select('*')
      .eq('user_id', userId)
      .gte('record_date', startDateStr)
      .lte('record_date', endDateStr)
      .order('record_date', { ascending: false })

    if (error) {
      console.error('获取健康摘要失败:', error)
      return res.status(500).json({
        success: false,
        error: '获取健康摘要失败'
      })
    }

    // 分析数据
    const summary = analyzeHealthData(healthData || [])

    res.json({
      success: true,
      summary,
      period
    })
  } catch (error) {
    console.error('获取健康摘要错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 删除健康数据
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const { error } = await supabaseAdmin
      .from('health_data')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('删除健康数据失败:', error)
      return res.status(500).json({
        success: false,
        error: '删除健康数据失败'
      })
    }

    res.json({
      success: true,
      message: '健康数据删除成功'
    })
  } catch (error) {
    console.error('删除健康数据错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 分析健康数据的辅助函数
function analyzeHealthData(data: any[]) {
  const summary: any = {
    totalRecords: data.length,
    exercise: { count: 0, totalDuration: 0, avgDuration: 0 },
    sleep: { count: 0, avgDuration: 0, avgQuality: 0 },
    nutrition: { count: 0, avgCalories: 0 },
    weight: { count: 0, latest: null, trend: 'stable' },
    bloodPressure: { count: 0, avgSystolic: 0, avgDiastolic: 0 }
  }

  const exerciseData = data.filter(d => d.data_type === 'exercise')
  const sleepData = data.filter(d => d.data_type === 'sleep')
  const nutritionData = data.filter(d => d.data_type === 'nutrition')
  const weightData = data.filter(d => d.data_type === 'weight')
  const bpData = data.filter(d => d.data_type === 'blood_pressure')

  // 运动数据分析
  if (exerciseData.length > 0) {
    summary.exercise.count = exerciseData.length
    summary.exercise.totalDuration = exerciseData.reduce((sum, d) => sum + (d.data_value.duration || 0), 0)
    summary.exercise.avgDuration = summary.exercise.totalDuration / exerciseData.length
  }

  // 睡眠数据分析
  if (sleepData.length > 0) {
    summary.sleep.count = sleepData.length
    summary.sleep.avgDuration = sleepData.reduce((sum, d) => sum + (d.data_value.duration || 0), 0) / sleepData.length
    const qualityData = sleepData.filter(d => d.data_value.quality)
    if (qualityData.length > 0) {
      summary.sleep.avgQuality = qualityData.reduce((sum, d) => sum + d.data_value.quality, 0) / qualityData.length
    }
  }

  // 营养数据分析
  if (nutritionData.length > 0) {
    summary.nutrition.count = nutritionData.length
    const caloriesData = nutritionData.filter(d => d.data_value.total_calories)
    if (caloriesData.length > 0) {
      summary.nutrition.avgCalories = caloriesData.reduce((sum, d) => sum + d.data_value.total_calories, 0) / caloriesData.length
    }
  }

  // 体重数据分析
  if (weightData.length > 0) {
    summary.weight.count = weightData.length
    summary.weight.latest = weightData[0].data_value.weight
    
    // 简单的趋势分析
    if (weightData.length >= 2) {
      const recent = weightData[0].data_value.weight
      const previous = weightData[1].data_value.weight
      if (recent > previous + 1) {
        summary.weight.trend = 'increasing'
      } else if (recent < previous - 1) {
        summary.weight.trend = 'decreasing'
      }
    }
  }

  // 血压数据分析
  if (bpData.length > 0) {
    summary.bloodPressure.count = bpData.length
    summary.bloodPressure.avgSystolic = bpData.reduce((sum, d) => sum + d.data_value.systolic, 0) / bpData.length
    summary.bloodPressure.avgDiastolic = bpData.reduce((sum, d) => sum + d.data_value.diastolic, 0) / bpData.length
  }

  return summary
}

export default router