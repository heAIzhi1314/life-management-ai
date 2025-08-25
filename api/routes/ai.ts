import express, { Request, Response } from 'express'
import { authenticateToken } from './auth.js'
import fetch from 'node-fetch'
import { supabaseAdmin } from '../lib/supabase.js'

const router = express.Router()

// 使用认证中间件
router.use(authenticateToken)

// AI对话接口（流式输出）
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, context, type = 'text', stream = true } = req.body
    const userId = req.user.userId

    if (!message) {
      return res.status(400).json({
        success: false,
        error: '消息内容不能为空'
      })
    }

    // 获取用户记忆和历史上下文
    const userMemories = await getUserMemories(userId)
    const conversationHistory = await getRecentConversations(userId, 5)
    const userProfile = await getUserProfile(userId)
    const dataInsights = await getRecentInsights(userId)

    if (stream) {
      // 设置SSE响应头
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      })

      try {
        // 构建增强的上下文
        const enhancedContext = {
          history: context?.history || [],
          memories: userMemories,
          conversationHistory,
          profile: userProfile,
          insights: dataInsights
        }
        
        // 调用流式DeepSeek API
        await callDeepSeekAPIStream(message, enhancedContext, res, userId)
      } catch (error) {
        console.error('流式AI对话错误:', error)
        
        // 发送错误事件
        res.write(`event: error\ndata: ${JSON.stringify({ error: 'AI服务暂时不可用' })}\n\n`)
        
        // 发送备用响应
        const fallbackResponse = generateMockAIResponse(message, context)
        res.write(`event: message\ndata: ${JSON.stringify({ content: fallbackResponse.response })}\n\n`)
        res.write(`event: done\ndata: ${JSON.stringify({ 
          actions: fallbackResponse.actions, 
          entities: fallbackResponse.entities,
          warning: 'AI服务暂时不可用，使用备用响应'
        })}\n\n`)
      }
      
      res.end()
    } else {
      // 构建增强的上下文
      const enhancedContext = {
        history: context?.history || [],
        memories: userMemories,
        conversationHistory,
        profile: userProfile,
        insights: dataInsights
      }
      
      // 非流式响应（保持兼容性）
      const aiResponse = await callDeepSeekAPI(message, enhancedContext)
      const parsedResponse = await parseAIResponse(aiResponse, message, userId)
      
      // 保存对话到历史记录
      await saveConversation(userId, message, parsedResponse.response, parsedResponse.entities?.intent, parsedResponse.actions)

      res.json({
        success: true,
        response: parsedResponse.response,
        actions: parsedResponse.actions,
        entities: parsedResponse.entities,
        operationResults: parsedResponse.operationResults
      })
    }
  } catch (error) {
    console.error('AI对话错误:', error)
    
    if (req.body.stream) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: 'AI服务暂时不可用' })}\n\n`)
      res.end()
    } else {
      const fallbackResponse = generateMockAIResponse(req.body.message, req.body.context)
      res.json({
        success: true,
        response: fallbackResponse.response,
        actions: fallbackResponse.actions,
        entities: fallbackResponse.entities,
        warning: 'AI服务暂时不可用，使用备用响应'
      })
    }
  }
})

// 语音转文字接口
router.post('/speech-to-text', async (req: Request, res: Response) => {
  try {
    const { audio_data } = req.body

    if (!audio_data) {
      return res.status(400).json({
        success: false,
        error: '音频数据不能为空'
      })
    }

    // TODO: 集成语音识别服务
    // 这里先返回模拟响应
    const mockText = '这是语音转换的文字内容'

    res.json({
      success: true,
      text: mockText,
      confidence: 0.95
    })
  } catch (error) {
    console.error('语音转文字错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 文字转语音接口
router.post('/text-to-speech', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'default' } = req.body

    if (!text) {
      return res.status(400).json({
        success: false,
        error: '文字内容不能为空'
      })
    }

    // TODO: 集成文字转语音服务
    // 这里先返回模拟响应
    res.json({
      success: true,
      audio_url: '/api/ai/mock-audio.mp3',
      duration: 5.2
    })
  } catch (error) {
    console.error('文字转语音错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 智能分析接口
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { data_type, data, analysis_type = 'general' } = req.body
    // 临时移除userId依赖，用于测试
    // const userId = req.user?.userId || 'test-user'

    if (!data_type || !data) {
      return res.status(400).json({
        success: false,
        error: '数据类型和数据内容不能为空'
      })
    }

    // TODO: 根据不同的数据类型进行AI分析
    const mockAnalysis = generateMockAnalysis(data_type, data, analysis_type)

    res.json({
      success: true,
      analysis: mockAnalysis
    })
  } catch (error) {
    console.error('智能分析错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 生成建议接口
router.post('/suggestions', async (req: Request, res: Response) => {
  try {
    const { context, suggestion_type = 'general' } = req.body
    // 临时移除userId依赖，用于测试
    // const userId = req.user?.userId || 'test-user'

    // TODO: 基于用户数据生成个性化建议
    const mockSuggestions = generateMockSuggestions(context, suggestion_type)

    res.json({
      success: true,
      suggestions: mockSuggestions
    })
  } catch (error) {
    console.error('生成建议错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 模拟AI响应生成函数
function generateMockAIResponse(message: string, context?: any) {
  const lowerMessage = message.toLowerCase()
  
  // 简单的关键词匹配逻辑
  if (lowerMessage.includes('提醒') || lowerMessage.includes('reminder')) {
    return {
      response: '我可以帮您创建提醒。请告诉我具体的提醒内容和时间。',
      actions: [{
        type: 'create_reminder',
        data: { extracted_content: message }
      }],
      entities: {
        intent: 'create_reminder',
        content: message
      }
    }
  }
  
  if (lowerMessage.includes('计划') || lowerMessage.includes('plan')) {
    return {
      response: '我可以帮您制定计划。请描述您想要实现的目标。',
      actions: [{
        type: 'create_plan',
        data: { extracted_content: message }
      }],
      entities: {
        intent: 'create_plan',
        content: message
      }
    }
  }
  
  if (lowerMessage.includes('记录') || lowerMessage.includes('record')) {
    return {
      response: '我已经记录了您的内容。您还需要添加标签吗？',
      actions: [{
        type: 'create_record',
        data: { content: message, type: 'text' }
      }],
      entities: {
        intent: 'create_record',
        content: message
      }
    }
  }
  
  if (lowerMessage.includes('健康') || lowerMessage.includes('health')) {
    return {
      response: '我可以帮您记录健康数据。请告诉我具体的健康信息。',
      actions: [{
        type: 'record_health',
        data: { extracted_content: message }
      }],
      entities: {
        intent: 'record_health',
        content: message
      }
    }
  }
  
  // 默认响应
  return {
    response: '我理解了您的需求。作为您的个人AI助手，我可以帮您管理记录、提醒、计划和健康数据。请告诉我您需要什么帮助？',
    actions: [],
    entities: {
      intent: 'general_chat',
      content: message
    }
  }
}

// 模拟分析生成函数
function generateMockAnalysis(dataType: string, data: any, analysisType: string) {
  switch (dataType) {
    case 'records':
      return {
        summary: '您最近的记录显示工作相关内容较多，建议适当增加生活和娱乐方面的记录。',
        insights: [
          '工作记录占比65%，生活记录占比35%',
          '最活跃的记录时间段是上午9-11点',
          '建议增加健康相关的记录'
        ],
        recommendations: [
          '每天记录一项积极的生活体验',
          '设置定期回顾记录的提醒',
          '尝试使用语音记录提高效率'
        ]
      }
    
    case 'health':
      return {
        summary: '您的健康数据显示整体趋势良好，但需要注意睡眠质量。',
        insights: [
          '平均睡眠时长7.2小时，符合建议标准',
          '运动频率每周3次，建议增加到4-5次',
          '饮食记录显示蛋白质摄入充足'
        ],
        recommendations: [
          '建立固定的睡眠时间',
          '增加有氧运动的频率',
          '多摄入蔬菜和水果'
        ]
      }
    
    default:
      return {
        summary: '数据分析完成，整体表现良好。',
        insights: ['数据趋势稳定', '活跃度适中'],
        recommendations: ['继续保持当前习惯', '适当调整优化']
      }
  }
}

// 模拟建议生成函数
function generateMockSuggestions(context: any, suggestionType: string) {
  const suggestions = [
    {
      type: 'productivity',
      title: '提高效率建议',
      content: '建议使用番茄工作法，每25分钟专注工作，然后休息5分钟。',
      priority: 'high'
    },
    {
      type: 'health',
      title: '健康生活建议',
      content: '每天至少步行8000步，保持充足的水分摄入。',
      priority: 'medium'
    },
    {
      type: 'planning',
      title: '计划管理建议',
      content: '将大目标分解为小任务，设置具体的截止日期。',
      priority: 'high'
    }
  ]
  
  return suggestions.filter(s => suggestionType === 'general' || s.type === suggestionType)
}

// DeepSeek API调用函数（非流式）
async function callDeepSeekAPI(message: string, context?: any): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  
  if (!apiKey) {
    console.warn('DeepSeek API密钥未配置，使用模拟响应')
    throw new Error('API密钥未配置')
  }

  try {
    // 构建增强的系统提示
    const enhancedSystemPrompt = context ? await buildEnhancedPrompt(message, context) : 
      '你是一个智能的个人生活助手，专门帮助用户管理日常生活、健康、学习和工作。请用简洁、友好的语言回答用户的问题，并在适当时提供实用的建议。'
    
    // 构建消息历史
    const messages = [
      {
        role: 'system',
        content: enhancedSystemPrompt
      }
    ]

    // 添加历史对话上下文
    if (context?.conversationHistory && Array.isArray(context.conversationHistory)) {
      context.conversationHistory.reverse().forEach((conv: any) => {
        messages.push(
          { role: 'user', content: conv.message },
          { role: 'assistant', content: conv.response }
        )
      })
    }

    // 添加传统上下文消息（保持兼容性）
    if (context?.history && Array.isArray(context.history)) {
      context.history.forEach((msg: any) => {
        messages.push({
          role: msg.role || 'user',
          content: msg.content
        })
      })
    } else if (Array.isArray(context)) {
      // 兼容旧的数组格式
      context.forEach((msg: any) => {
        messages.push({
          role: msg.role || 'user',
          content: msg.content
        })
      })
    }

    // 添加当前用户消息
    messages.push({
      role: 'user',
      content: message
    })

    const requestBody = {
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('DeepSeek API错误:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json() as any

    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content
    } else {
      throw new Error('无效的API响应格式')
    }
  } catch (error) {
    console.error('DeepSeek API调用失败:', error)
    throw error
  }
}

// DeepSeek API流式调用函数
async function callDeepSeekAPIStream(message: string, context: any, res: any, userId: string): Promise<void> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  
  if (!apiKey) {
    throw new Error('API密钥未配置')
  }

  try {
    // 构建增强的系统提示
    const enhancedSystemPrompt = await buildEnhancedPrompt(message, context)
    
    // 构建消息历史
    const messages = [
      {
        role: 'system',
        content: enhancedSystemPrompt
      }
    ]

    // 添加历史对话上下文
    if (context.conversationHistory && Array.isArray(context.conversationHistory)) {
      context.conversationHistory.reverse().forEach((conv: any) => {
        messages.push(
          { role: 'user', content: conv.message },
          { role: 'assistant', content: conv.response }
        )
      })
    }

    // 添加传统上下文消息（保持兼容性）
    if (context.history && Array.isArray(context.history)) {
      context.history.forEach((msg: any) => {
        messages.push({
          role: msg.role || 'user',
          content: msg.content
        })
      })
    }

    // 添加当前用户消息
    messages.push({
      role: 'user',
      content: message
    })

    const requestBody = {
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // 检查响应体是否存在
    if (!response.body) {
      throw new Error('响应体为空')
    }

    let fullResponse = ''

    // 使用异步迭代器处理流式响应
    try {
      const decoder = new TextDecoder()
      
      for await (const chunk of response.body as any) {
        const text = decoder.decode(chunk, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            
            if (data === '[DONE]') {
              // 流式响应结束，发送完成事件和解析结果
              const parsedResponse = await parseAIResponse(fullResponse, message, userId)
              
              // 保存对话到历史记录（使用增强的响应）
              await saveConversation(userId, message, parsedResponse.response, parsedResponse.entities?.intent, parsedResponse.actions)
              
              res.write(`event: done\ndata: ${JSON.stringify({
                actions: parsedResponse.actions,
                entities: parsedResponse.entities,
                operationResults: parsedResponse.operationResults
              })}\n\n`)
              return
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                const content = parsed.choices[0].delta.content
                fullResponse += content
                
                // 发送流式内容
                res.write(`event: message\ndata: ${JSON.stringify({ content })}\n\n`)
              }
            } catch (parseError) {
              // 忽略解析错误，继续处理下一行
              continue
            }
          }
        }
      }
    } catch (streamError) {
      console.error('流式处理错误:', streamError)
      throw streamError
    }
  } catch (error) {
    console.error('DeepSeek流式API调用失败:', error)
    console.log('尝试使用非流式API作为备用方案')
    
    try {
      // 降级到非流式API调用
      const fallbackResponse = await callDeepSeekAPI(message, context)
      const parsedResponse = await parseAIResponse(fallbackResponse, message, userId)
      
      // 发送完整响应
      res.write(`event: message\ndata: ${JSON.stringify({ content: parsedResponse.response })}\n\n`)
      res.write(`event: done\ndata: ${JSON.stringify({
        actions: parsedResponse.actions,
        entities: parsedResponse.entities,
        operationResults: parsedResponse.operationResults,
        warning: 'AI服务暂时不可用，使用备用响应'
      })}\n\n`)
    } catch (fallbackError) {
      console.error('备用API调用也失败:', fallbackError)
      // 发送错误响应
      res.write(`event: done\ndata: ${JSON.stringify({
        error: 'AI服务暂时不可用'
      })}\n\n`)
    }
  }
}

// 获取用户自定义关键词配置
async function getUserKeywordConfigs(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('keyword_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (error) {
      console.error('Error fetching user keyword configs:', error)
      // 返回默认关键词配置
      return getDefaultKeywordConfigs()
    }

    // 如果用户没有自定义配置，返回默认配置
    if (!data || data.length === 0) {
      return getDefaultKeywordConfigs()
    }

    return data
  } catch (error) {
    console.error('Error in getUserKeywordConfigs:', error)
    return getDefaultKeywordConfigs()
  }
}

// 获取默认关键词配置
function getDefaultKeywordConfigs() {
  return [
    { category: 'record', keywords: ['记录', '记下', '保存', '备忘'], priority: 1 },
    { category: 'reminder', keywords: ['提醒', '提醒我', '别忘了', '记得'], priority: 1 },
    { category: 'plan', keywords: ['计划', '安排', '规划', '打算'], priority: 1 },
    { category: 'health', keywords: ['健康', '体重', '血压', '运动', '跑步', '健身', '游泳', '骑车', '睡眠', '卡路里'], priority: 1 },
    { category: 'growth', keywords: ['成长', '学习', '进步', '目标'], priority: 1 }
  ]
}

// 检查消息是否匹配指定类别的关键词
function matchesKeywords(message: string, response: string, keywords: string[]): boolean {
  const lowerMessage = message.toLowerCase()
  const lowerResponse = response.toLowerCase()
  
  return keywords.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase()) || 
    lowerResponse.includes(keyword.toLowerCase())
  )
}

// 解析AI响应并提取意图和实体
async function parseAIResponse(aiResponse: string, originalMessage: string, userId: string) {
  const lowerMessage = originalMessage.toLowerCase()
  const lowerResponse = aiResponse.toLowerCase()
  
  let actions: any[] = []
  let entities: any = {
    intent: 'general_chat',
    content: originalMessage
  }
  let operationResults: any[] = []

  // 获取用户自定义关键词配置
  const keywordConfigs = await getUserKeywordConfigs(userId)
  
  // 按优先级排序，优先级高的先匹配
  const sortedConfigs = keywordConfigs.sort((a, b) => (b.priority || 1) - (a.priority || 1))
  
  // 基于用户自定义关键词识别意图并执行相应的操作
  for (const config of sortedConfigs) {
    if (matchesKeywords(originalMessage, aiResponse, config.keywords)) {
      switch (config.category) {
        case 'reminder':
          entities.intent = 'create_reminder'
          const reminderData = extractReminderInfo(originalMessage)
          
          try {
            const result = await createReminder(userId, reminderData)
            operationResults.push({
              type: 'reminder_created',
              success: true,
              data: result
            })
            actions.push({
              type: 'create_reminder',
              data: reminderData,
              result: result
            })
          } catch (error) {
            operationResults.push({
              type: 'reminder_failed',
              success: false,
              error: error.message
            })
          }
          break
          
        case 'plan':
          entities.intent = 'create_plan'
          const planData = extractPlanInfo(originalMessage)
          
          try {
            const result = await createPlan(userId, planData)
            operationResults.push({
              type: 'plan_created',
              success: true,
              data: result
            })
            actions.push({
              type: 'create_plan',
              data: planData,
              result: result
            })
          } catch (error) {
            operationResults.push({
              type: 'plan_failed',
              success: false,
              error: error.message
            })
          }
          break
          
        case 'record':
          entities.intent = 'create_record'
          const recordData = extractRecordInfo(originalMessage)
          
          try {
            const result = await createRecord(userId, recordData)
            operationResults.push({
              type: 'record_created',
              success: true,
              data: result
            })
            actions.push({
              type: 'create_record',
              data: recordData,
              result: result
            })
          } catch (error) {
            operationResults.push({
              type: 'record_failed',
              success: false,
              error: error.message
            })
          }
          break
          
        case 'health':
          entities.intent = 'record_health'
          const healthData = extractHealthInfo(originalMessage)
          
          try {
            const result = await createHealthRecord(userId, healthData)
            operationResults.push({
              type: 'health_recorded',
              success: true,
              data: result
            })
            actions.push({
              type: 'record_health',
              data: healthData,
              result: result
            })
          } catch (error) {
            operationResults.push({
              type: 'health_failed',
              success: false,
              error: error.message
            })
          }
          break
          
        case 'growth':
          // 成长类别可以创建目标或计划
          entities.intent = 'create_plan'
          const growthPlanData = {
            ...extractPlanInfo(originalMessage),
            category: 'personal' // 映射到数据库允许的值
          }
          
          try {
            const result = await createPlan(userId, growthPlanData)
            operationResults.push({
              type: 'growth_plan_created',
              success: true,
              data: result
            })
            actions.push({
              type: 'create_plan',
              data: growthPlanData,
              result: result
            })
          } catch (error) {
            operationResults.push({
              type: 'growth_plan_failed',
              success: false,
              error: error.message
            })
          }
          break
      }
      
      // 找到匹配的关键词后，跳出循环（优先级高的先匹配）
      break
    }
  }

  // 如果有操作结果，增强AI响应
  let enhancedResponse = aiResponse
  if (operationResults.length > 0) {
    const successResults = operationResults.filter(r => r.success)
    const failedResults = operationResults.filter(r => !r.success)
    
    if (successResults.length > 0) {
      enhancedResponse += '\n\n✅ 操作完成：'
      successResults.forEach(result => {
        switch (result.type) {
          case 'reminder_created':
            enhancedResponse += `\n- 已创建提醒：${result.data.title}`
            break
          case 'plan_created':
            enhancedResponse += `\n- 已创建计划：${result.data.title}`
            break
          case 'record_created':
            enhancedResponse += `\n- 已保存记录：${result.data.content.substring(0, 30)}...`
            break
          case 'health_recorded':
            enhancedResponse += `\n- 已记录健康数据`
            break
        }
      })
    }
    
    if (failedResults.length > 0) {
      enhancedResponse += '\n\n❌ 操作失败：'
      failedResults.forEach(result => {
        enhancedResponse += `\n- ${result.error}`
      })
    }
  }

  return {
    response: enhancedResponse,
    actions: actions,
    entities: entities,
    operationResults: operationResults
  }
}

// 信息提取函数
function extractReminderInfo(message: string) {
  const lowerMessage = message.toLowerCase()
  
  // 提取时间信息
  let reminderTime = null
  const timePatterns = [
    /明天|tomorrow/i,
    /后天|day after tomorrow/i,
    /下周|next week/i,
    /\d{1,2}点|\d{1,2}:\d{2}/i,
    /\d{1,2}月\d{1,2}日/i
  ]
  
  for (const pattern of timePatterns) {
    if (pattern.test(message)) {
      reminderTime = new Date(Date.now() + 24 * 60 * 60 * 1000) // 默认明天
      break
    }
  }
  
  // 提取优先级
  let priority = 'medium'
  if (lowerMessage.includes('紧急') || lowerMessage.includes('urgent')) {
    priority = 'high'
  } else if (lowerMessage.includes('不急') || lowerMessage.includes('low')) {
    priority = 'low'
  }
  
  return {
    title: message.length > 50 ? message.substring(0, 50) + '...' : message,
    description: message,
    remind_time: reminderTime || new Date(Date.now() + 24 * 60 * 60 * 1000),
    priority: priority,
    is_completed: false
  }
}

function extractPlanInfo(message: string) {
  const lowerMessage = message.toLowerCase()
  
  // 提取计划类型
  let category = 'personal'
  if (lowerMessage.includes('工作') || lowerMessage.includes('work')) {
    category = 'work'
  } else if (lowerMessage.includes('健康') || lowerMessage.includes('health')) {
    category = 'health'
  } else if (lowerMessage.includes('学习') || lowerMessage.includes('study') || lowerMessage.includes('编程') || lowerMessage.includes('programming')) {
    category = 'study' // 修正为数据库约束允许的值
  }
  
  return {
    title: message.length > 50 ? message.substring(0, 50) + '...' : message,
    description: message,
    category: category,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 默认30天后
    status: 'active'
  }
}

function extractRecordInfo(message: string) {
  const lowerMessage = message.toLowerCase()
  
  // 提取记录类型
  let type = 'text'
  if (lowerMessage.includes('语音') || lowerMessage.includes('voice')) {
    type = 'voice'
  } else if (lowerMessage.includes('图片') || lowerMessage.includes('image')) {
    type = 'image'
  }
  
  // 提取标签
  const tags: string[] = []
  if (lowerMessage.includes('工作')) tags.push('工作')
  if (lowerMessage.includes('生活')) tags.push('生活')
  if (lowerMessage.includes('学习')) tags.push('学习')
  if (lowerMessage.includes('健康')) tags.push('健康')
  
  return {
    content: message,
    type: type,
    tags: tags.length > 0 ? tags : ['日常']
  }
}

function extractHealthInfo(message: string) {
  const lowerMessage = message.toLowerCase()
  
  // 提取健康数据类型和值
  let dataType = 'exercise' // 默认为运动类型
  let dataValue: any = {}
  
  if (lowerMessage.includes('运动') || lowerMessage.includes('exercise') || lowerMessage.includes('跑步') || lowerMessage.includes('running') || lowerMessage.includes('健身') || lowerMessage.includes('游泳') || lowerMessage.includes('骑车')) {
    dataType = 'exercise'
    
    // 尝试提取数字信息
    const durationMatch = message.match(/(\d+)分钟/)
    const caloriesMatch = message.match(/(\d+)卡路里/)
    
    dataValue = {
      type: lowerMessage.includes('跑步') ? '跑步' : '其他运动',
      duration: durationMatch ? parseInt(durationMatch[1]) : 30,
      calories: caloriesMatch ? parseInt(caloriesMatch[1]) : 200,
      notes: message
    }
  } else if (lowerMessage.includes('睡眠') || lowerMessage.includes('sleep')) {
    dataType = 'sleep'
    dataValue = {
      bedtime: '23:00',
      wake_time: '07:00',
      quality: 'good',
      notes: message
    }
  } else if (lowerMessage.includes('体重') || lowerMessage.includes('weight')) {
    dataType = 'weight'
    dataValue = {
      weight: 70, // 默认值
      body_fat: 15,
      notes: message
    }
  } else {
    // 默认为运动记录
    dataValue = {
      type: '日常活动',
      notes: message
    }
  }
  
  return {
    data_type: dataType,
    data_value: dataValue,
    record_date: new Date().toISOString().split('T')[0] // 今天的日期
  }
}

// 数据库操作函数
async function createReminder(userId: string, reminderData: any) {
  const { data, error } = await supabaseAdmin
    .from('reminders')
    .insert({
      user_id: userId,
      ...reminderData
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`创建提醒失败: ${error.message}`)
  }
  
  return data
}

async function createPlan(userId: string, planData: any) {
  const { data, error } = await supabaseAdmin
    .from('plans')
    .insert({
      user_id: userId,
      ...planData
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`创建计划失败: ${error.message}`)
  }
  
  return data
}

async function createRecord(userId: string, recordData: any) {
  const { data, error } = await supabaseAdmin
    .from('records')
    .insert({
      user_id: userId,
      ...recordData
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`创建记录失败: ${error.message}`)
  }
  
  return data
}

async function createHealthRecord(userId: string, healthData: any) {
  const { data, error } = await supabaseAdmin
    .from('health_data')
    .insert({
      user_id: userId,
      ...healthData
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`记录健康数据失败: ${error.message}`)
  }
  
  return data
}

// 记忆和历史上下文相关函数

// 获取用户记忆
async function getUserMemories(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_memories')
      .select('*')
      .eq('user_id', userId)
      .gte('confidence_score', 0.7) // 只获取高置信度的记忆
      .order('updated_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching user memories:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserMemories:', error)
    return []
  }
}

// 获取最近的对话历史
async function getRecentConversations(userId: string, limit: number = 5) {
  try {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('message, response, intent, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching conversation history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getRecentConversations:', error)
    return []
  }
}

// 获取用户档案
async function getUserProfile(userId: string) {
  try {
    // 并行获取用户的各种信息
    const [userInfo, memories, activePlans, recentRecords, healthData] = await Promise.all([
      // 基本用户信息
      supabaseAdmin
        .from('users')
        .select('name, email, plan_type, preferences, created_at')
        .eq('id', userId)
        .single(),
      
      // 用户记忆（偏好和习惯）
      supabaseAdmin
        .from('user_memories')
        .select('*')
        .eq('user_id', userId)
        .in('memory_type', ['preference', 'habit', 'goal'])
        .gte('confidence_score', 0.7)
        .order('updated_at', { ascending: false })
        .limit(10),
      
      // 活跃的计划
      supabaseAdmin
        .from('plans')
        .select('title, category, status, progress, start_date, end_date')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5),
      
      // 最近的记录
      supabaseAdmin
        .from('records')
        .select('content, type, tags, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),
      
      // 最近的健康数据
      supabaseAdmin
        .from('health_data')
        .select('data_type, data_value, record_date')
        .eq('user_id', userId)
        .order('record_date', { ascending: false })
        .limit(3)
    ])

    // 构建完整的用户档案
    const profile: Record<string, any> = {
      // 基本信息
      basicInfo: userInfo.data || {},
      
      // 偏好和习惯
      preferences: {},
      habits: {},
      goals: {},
      
      // 活动数据
      activePlans: activePlans.data || [],
      recentRecords: recentRecords.data || [],
      healthData: healthData.data || []
    }

    // 处理用户记忆
    if (memories.data) {
      memories.data.forEach(memory => {
        switch (memory.memory_type) {
          case 'preference':
            profile.preferences[memory.key] = memory.value
            break
          case 'habit':
            profile.habits[memory.key] = memory.value
            break
          case 'goal':
            profile.goals[memory.key] = memory.value
            break
        }
      })
    }

    return profile
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return {}
  }
}

// 获取最近的数据洞察
async function getRecentInsights(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('data_insights')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('generated_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching data insights:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getRecentInsights:', error)
    return []
  }
}

// 保存对话到历史记录
async function saveConversation(userId: string, message: string, response: string, intent?: string, actions?: any[]) {
  try {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        user_id: userId,
        message,
        response,
        intent: intent || null,
        actions: actions || [],
        context: {}
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving conversation:', error)
      return null
    }

    // 异步更新用户记忆
    updateUserMemoriesFromConversation(userId, message, response, intent)

    return data
  } catch (error) {
    console.error('Error in saveConversation:', error)
    return null
  }
}

// 从对话中更新用户记忆
async function updateUserMemoriesFromConversation(userId: string, message: string, response: string, intent?: string) {
  try {
    const memories = []
    const lowerMessage = message.toLowerCase()
    const lowerResponse = response.toLowerCase()

    // 提取偏好信息
    if (lowerMessage.includes('喜欢') || lowerMessage.includes('不喜欢') || lowerMessage.includes('偏好')) {
      memories.push({
        user_id: userId,
        memory_type: 'preference',
        key: 'conversation_preference',
        value: { message, response, extracted_at: new Date().toISOString() },
        confidence_score: 0.8,
        source: 'conversation'
      })
    }

    // 提取习惯信息
    if (lowerMessage.includes('通常') || lowerMessage.includes('习惯') || lowerMessage.includes('经常')) {
      memories.push({
        user_id: userId,
        memory_type: 'habit',
        key: 'behavioral_pattern',
        value: { pattern: message, context: response, extracted_at: new Date().toISOString() },
        confidence_score: 0.7,
        source: 'conversation'
      })
    }

    // 提取目标信息
    if (lowerMessage.includes('目标') || lowerMessage.includes('想要') || lowerMessage.includes('希望')) {
      memories.push({
        user_id: userId,
        memory_type: 'goal',
        key: 'user_goal',
        value: { goal: message, context: response, extracted_at: new Date().toISOString() },
        confidence_score: 0.9,
        source: 'conversation'
      })
    }

    // 保存记忆
    if (memories.length > 0) {
      const { error } = await supabaseAdmin
        .from('user_memories')
        .upsert(memories, {
          onConflict: 'user_id,memory_type,key',
          ignoreDuplicates: false
        })

      if (error) {
        console.error('Error updating user memories:', error)
      }
    }
  } catch (error) {
    console.error('Error in updateUserMemoriesFromConversation:', error)
  }
}

// 增强DeepSeek API调用以包含上下文
async function buildEnhancedPrompt(message: string, context: any) {
  let systemPrompt = '你是一个智能的个人生活助手，专门帮助用户管理日常生活、健康、学习和工作。'
  
  // 添加对话历史上下文
  if (context.conversationHistory && context.conversationHistory.length > 0) {
    systemPrompt += '\n\n最近的对话历史：'
    context.conversationHistory.slice(0, 3).forEach((conv: any) => {
      systemPrompt += `\n- 用户: ${conv.message}\n- 助手: ${conv.response}`
    })
  }
  
  // 添加用户档案信息
  if (context.profile && Object.keys(context.profile).length > 0) {
    systemPrompt += '\n\n用户档案信息：'
    Object.entries(context.profile).forEach(([key, value]) => {
      systemPrompt += `\n- ${key}: ${JSON.stringify(value)}`
    })
  }

  // 添加最近的洞察
  if (context.insights && context.insights.length > 0) {
    systemPrompt += '\n\n最近的数据洞察：'
    context.insights.forEach((insight: any) => {
      systemPrompt += `\n- ${insight.title}: ${insight.description}`
    })
  }

  // 添加相关记忆（按类型分组显示）
  if (context.memories && context.memories.length > 0) {
    systemPrompt += '\n\n用户记忆：'
    const memoryByType = context.memories.reduce((acc: any, memory: any) => {
      if (!acc[memory.memory_type]) acc[memory.memory_type] = []
      acc[memory.memory_type].push(memory)
      return acc
    }, {})
    
    Object.entries(memoryByType).forEach(([type, memories]: [string, any]) => {
      systemPrompt += `\n- ${type}:`
      memories.slice(0, 2).forEach((memory: any) => {
        const valueStr = typeof memory.value === 'object' ? 
          JSON.stringify(memory.value).substring(0, 100) : 
          String(memory.value).substring(0, 100)
        systemPrompt += `\n  * ${memory.key}: ${valueStr}`
      })
    })
  }

  systemPrompt += '\n\n请基于这些信息提供个性化和有针对性的回答，记住用户的偏好和历史对话内容。'

  return systemPrompt
}

export default router