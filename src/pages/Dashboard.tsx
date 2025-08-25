import React, { useState, useEffect, useMemo } from 'react'
import { MessageCircle, Plus, Mic, MicOff, Send, Calendar, Bell, Activity, Target, Brain, TrendingUp, Lightbulb, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useRecords } from '@/contexts/RecordsContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

// 优化的Markdown组件，使用React.memo避免不必要的重新渲染
const MemoizedMarkdown = React.memo(({ content }: { content: string }) => {
  const markdownComponents = useMemo(() => ({
    p: ({children}: any) => <p className="mb-2 last:mb-0">{children}</p>,
    code: ({inline, children}: any) => 
      inline ? 
        <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">{children}</code> : 
        <code className="block bg-gray-100 p-2 rounded text-xs overflow-x-auto">{children}</code>,
    pre: ({children}: any) => <pre className="bg-gray-100 p-2 rounded overflow-x-auto">{children}</pre>,
    ul: ({children}: any) => <ul className="list-disc list-inside mb-2">{children}</ul>,
    ol: ({children}: any) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
    li: ({children}: any) => <li className="mb-1">{children}</li>,
    a: ({href, children}: any) => <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
    strong: ({children}: any) => <strong className="font-semibold">{children}</strong>,
    em: ({children}: any) => <em className="italic">{children}</em>
  }), [])

  return (
    <div className="text-sm prose prose-sm max-w-none">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})

MemoizedMarkdown.displayName = 'MemoizedMarkdown'

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
}

interface QuickAction {
  id: string
  title: string
  icon: React.ComponentType<any>
  color: string
  action: () => void
}

interface TodayOverview {
  reminders: number
  completedTasks: number
  totalTasks: number
  healthScore: number
}

export default function Dashboard() {
  const { token } = useAuth()
  const { addRecord, createRecord } = useRecords()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '您好！我是您的个人AI助手，可以帮您管理记录、提醒、计划和健康数据。有什么可以帮您的吗？',
      sender: 'ai',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [todayOverview, setTodayOverview] = useState<TodayOverview>({
    reminders: 3,
    completedTasks: 5,
    totalTasks: 8,
    healthScore: 85
  })
  const [insights, setInsights] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [userMemories, setUserMemories] = useState<any[]>([])
  const [conversationStats, setConversationStats] = useState<any>(null)
  const [showInsightsPanel, setShowInsightsPanel] = useState(false)

  // 获取AI洞察和记忆数据
  const fetchInsightsAndMemories = async () => {
    if (!token) return

    try {
      // 并行获取各种数据
      const [insightsRes, recommendationsRes, memoriesRes, conversationStatsRes] = await Promise.all([
        fetch('/api/insights', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/insights/recommendations', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/memories', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/conversations/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (insightsRes.ok) {
        const data = await insightsRes.json()
        setInsights(data.insights || [])
      }

      if (recommendationsRes.ok) {
        const data = await recommendationsRes.json()
        setRecommendations(data.recommendations || [])
      }

      if (memoriesRes.ok) {
        const data = await memoriesRes.json()
        setUserMemories(data.memories || [])
      }

      if (conversationStatsRes.ok) {
        const data = await conversationStatsRes.json()
        setConversationStats(data)
      }
    } catch (error) {
      console.error('Error fetching insights and memories:', error)
    }
  }

  // 生成新的洞察
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)
  const generateInsights = async () => {
    if (!token || isGeneratingInsights) return

    setIsGeneratingInsights(true)
    try {
      const response = await fetch('/api/insights/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          categories: ['records', 'health', 'plans', 'reminders']
        })
      })

      if (response.ok) {
        const result = await response.json()
        await fetchInsightsAndMemories() // 重新获取数据
        console.log('洞察生成成功:', result)
      } else {
        const errorData = await response.json()
        console.error('生成洞察失败:', errorData)
        
        // 为RLS相关错误提供更清晰的用户反馈
        if (errorData.code === '42501') {
          alert('权限错误: 用户没有权限访问数据表，请检查登录状态或联系管理员')
        } else if (errorData.code === 'PGRST116') {
          alert('认证错误: 用户身份验证失败，请重新登录')
        } else {
          alert(`生成洞察失败: ${errorData.error || errorData.details || '未知错误'}，请稍后重试`)
        }
      }
    } catch (error) {
      console.error('Error generating insights:', error)
      alert('网络错误，请检查网络连接后重试')
    } finally {
      setIsGeneratingInsights(false)
    }
  }

  // 更新推荐状态
  const updateRecommendationStatus = async (recommendationId: string, status: 'accepted' | 'dismissed' | 'completed') => {
    if (!token) return

    try {
      const response = await fetch(`/api/insights/recommendations/${recommendationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        // 更新本地状态
        setRecommendations(prev => 
          prev.map(rec => 
            rec.id === recommendationId 
              ? { ...rec, status }
              : rec
          ).filter(rec => rec.status === 'pending') // 只显示待处理的推荐
        )
      }
    } catch (error) {
      console.error('Error updating recommendation status:', error)
    }
  }

  // 组件挂载时获取数据
  useEffect(() => {
    fetchInsightsAndMemories()
  }, [token])

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: '快速记录',
      icon: Plus,
      color: 'bg-blue-500',
      action: () => handleQuickRecord()
    },
    {
      id: '2',
      title: '添加提醒',
      icon: Bell,
      color: 'bg-orange-500',
      action: () => handleQuickReminder()
    },
    {
      id: '3',
      title: '创建计划',
      icon: Calendar,
      color: 'bg-green-500',
      action: () => handleQuickPlan()
    },
    {
      id: '4',
      title: '健康打卡',
      icon: Activity,
      color: 'bg-red-500',
      action: () => handleHealthCheck()
    }
  ]

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }

    const currentMessage = inputMessage
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    // 创建AI消息占位符
    const aiMessageId = (Date.now() + 1).toString()
    const aiMessage: Message = {
      id: aiMessageId,
      content: '',
      sender: 'ai',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, aiMessage])

    try {
      // 调用流式AI API
      if (!token) {
        throw new Error('用户未登录，请先登录')
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: currentMessage,
          context: {
            history: messages.slice(-4).map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.content
            }))
          },
          type: 'text',
          stream: true
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''
      let hasReceivedData = false
      
      // 设置超时机制
      const timeoutId = setTimeout(() => {
        reader.cancel()
        throw new Error('AI响应超时，请稍后重试')
      }, 30000) // 30秒超时

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          hasReceivedData = true
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.trim() === '') continue
            
            if (line.startsWith('event: ')) {
              const eventType = line.slice(7).trim()
              console.log('收到事件:', eventType)
              continue
            }
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              
              if (data === '[DONE]') {
                console.log('流式响应完成')
                break
              }
              
              try {
                const parsed = JSON.parse(data)
                console.log('解析数据:', parsed)
                
                if (parsed.content) {
                  fullContent += parsed.content
                  
                  // 更新AI消息内容（打字机效果）
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, content: fullContent }
                      : msg
                  ))
                }
                
                if (parsed.actions || parsed.entities || parsed.operationResults) {
                  console.log('AI响应完成:', { 
                    actions: parsed.actions, 
                    entities: parsed.entities,
                    operationResults: parsed.operationResults 
                  })
                  
                  // 处理操作结果，显示操作确认信息
                  if (parsed.operationResults && parsed.operationResults.length > 0) {
                    parsed.operationResults.forEach((result: any) => {
                      if (result.success) {
                        console.log(`操作成功: ${result.type}`, result.data)
                        
                        // 如果是记录创建成功，同步更新Records页面
                        if (result.type === 'record_created' && result.data) {
                          addRecord(result.data)
                        }
                      } else {
                        console.error(`操作失败: ${result.type}`, result.error)
                      }
                    })
                  }
                }
                
                // 处理警告信息（不抛出错误）
                if (parsed.warning) {
                  console.warn('AI服务警告:', parsed.warning)
                }
                
                // 只有真正的错误才抛出异常
                if (parsed.error) {
                  throw new Error(parsed.error)
                }
              } catch (parseError) {
                console.warn('解析数据失败:', parseError, '原始数据:', data)
                // 如果不是JSON格式，可能是纯文本内容
                if (data && !data.startsWith('{')) {
                  fullContent += data
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, content: fullContent }
                      : msg
                  ))
                }
              }
            }
          }
        }
      } finally {
        clearTimeout(timeoutId)
        reader.releaseLock()
      }
      
      // 检查是否收到了响应数据
      if (!hasReceivedData) {
        throw new Error('未收到服务器响应，请检查网络连接')
      }
      
      // 如果没有收到任何内容，使用降级响应
      if (!fullContent) {
        console.warn('未收到AI内容，使用降级响应')
        const fallbackResponse = generateAIResponse(currentMessage)
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: fallbackResponse }
            : msg
        ))
      }
      
    } catch (error) {
      console.error('发送消息失败:', error)
      
      // 更新AI消息为错误内容
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, content: '抱歉，AI服务暂时不可用。请稍后再试。' }
          : msg
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording)
    // TODO: 实现语音录制功能
    if (!isRecording) {
      console.log('开始录音')
    } else {
      console.log('停止录音')
    }
  }

  const [showRecordModal, setShowRecordModal] = useState(false)
  const [recordForm, setRecordForm] = useState({
    content: '',
    type: 'text' as 'text' | 'voice' | 'image',
    tags: [] as string[]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleQuickRecord = () => {
    setShowRecordModal(true)
  }

  const handleRecordSubmit = async () => {
    if (!recordForm.content.trim()) return
    
    setIsSubmitting(true)
    try {
      // 使用RecordsContext的createRecord方法，自动同步到Records页面
      const result = await createRecord({
        content: recordForm.content,
        type: recordForm.type,
        tags: recordForm.tags
      })
      
      if (result) {
        // 添加成功消息到聊天
        const successMessage: Message = {
          id: Date.now().toString(),
          content: `✅ 记录已成功保存："${recordForm.content}"`,
          sender: 'ai',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, successMessage])
        
        // 重置表单
        setRecordForm({ content: '', type: 'text', tags: [] })
        setShowRecordModal(false)
      } else {
        throw new Error('保存记录失败')
      }
    } catch (error) {
      console.error('保存记录失败:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `❌ 保存记录失败：${error instanceof Error ? error.message : '未知错误'}`,
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSubmitting(false)
    }
  }

  const [showReminderModal, setShowReminderModal] = useState(false)
  const [reminderForm, setReminderForm] = useState({
    title: '',
    description: '',
    remind_time: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  })

  const handleQuickReminder = () => {
    setShowReminderModal(true)
  }

  const handleReminderSubmit = async () => {
    if (!reminderForm.title.trim() || !reminderForm.remind_time) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reminderForm)
      })
      
      const data = await response.json()
      
      if (data.success) {
        const successMessage: Message = {
          id: Date.now().toString(),
          content: `⏰ 提醒已成功创建："${reminderForm.title}" - ${new Date(reminderForm.remind_time).toLocaleString('zh-CN')}`,
          sender: 'ai',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, successMessage])
        
        setReminderForm({ title: '', description: '', remind_time: '', priority: 'medium' })
        setShowReminderModal(false)
      } else {
        throw new Error(data.error || '创建提醒失败')
      }
    } catch (error) {
      console.error('创建提醒失败:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `❌ 创建提醒失败：${error instanceof Error ? error.message : '未知错误'}`,
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSubmitting(false)
    }
  }

  const [showPlanModal, setShowPlanModal] = useState(false)
  const [planForm, setPlanForm] = useState({
    title: '',
    description: '',
    category: 'personal' as 'personal' | 'work' | 'health' | 'learning',
    start_date: '',
    end_date: ''
  })

  const handleQuickPlan = () => {
    setShowPlanModal(true)
  }

  const handlePlanSubmit = async () => {
    if (!planForm.title.trim()) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(planForm)
      })
      
      const data = await response.json()
      
      if (data.success) {
        const successMessage: Message = {
          id: Date.now().toString(),
          content: `📋 计划已成功创建："${planForm.title}" - 分类：${planForm.category === 'personal' ? '个人' : planForm.category === 'work' ? '工作' : planForm.category === 'health' ? '健康' : '学习'}`,
          sender: 'ai',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, successMessage])
        
        setPlanForm({ title: '', description: '', category: 'personal', start_date: '', end_date: '' })
        setShowPlanModal(false)
      } else {
        throw new Error(data.error || '创建计划失败')
      }
    } catch (error) {
      console.error('创建计划失败:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `❌ 创建计划失败：${error instanceof Error ? error.message : '未知错误'}`,
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSubmitting(false)
    }
  }

  const [showHealthModal, setShowHealthModal] = useState(false)
  const [healthForm, setHealthForm] = useState({
    type: 'exercise' as 'exercise' | 'sleep' | 'weight',
    // 运动数据
    exercise_type: '',
    duration: '',
    distance: '',
    calories: '',
    // 睡眠数据
    bedtime: '',
    wake_time: '',
    sleep_duration: '',
    sleep_quality: 'good' as 'poor' | 'fair' | 'good' | 'excellent',
    // 体重数据
    weight: '',
    body_fat: '',
    // 通用
    notes: ''
  })

  const handleHealthCheck = () => {
    setShowHealthModal(true)
  }

  const handleHealthSubmit = async () => {
    setIsSubmitting(true)
    try {
      let endpoint = ''
      let requestData: any = {}
      
      if (healthForm.type === 'exercise') {
        if (!healthForm.exercise_type || !healthForm.duration) {
          throw new Error('运动类型和时长不能为空')
        }
        endpoint = '/api/health/exercise'
        requestData = {
          type: healthForm.exercise_type,
          duration: parseInt(healthForm.duration),
          distance: healthForm.distance ? parseFloat(healthForm.distance) : null,
          calories: healthForm.calories ? parseInt(healthForm.calories) : null,
          notes: healthForm.notes
        }
      } else if (healthForm.type === 'sleep') {
        if (!healthForm.bedtime || !healthForm.wake_time || !healthForm.sleep_duration) {
          throw new Error('就寝时间、起床时间和睡眠时长不能为空')
        }
        endpoint = '/api/health/sleep'
        requestData = {
          bedtime: healthForm.bedtime,
          wake_time: healthForm.wake_time,
          duration: parseFloat(healthForm.sleep_duration),
          quality: healthForm.sleep_quality,
          notes: healthForm.notes
        }
      } else if (healthForm.type === 'weight') {
        if (!healthForm.weight) {
          throw new Error('体重数据不能为空')
        }
        endpoint = '/api/health/weight'
        requestData = {
          weight: parseFloat(healthForm.weight),
          body_fat: healthForm.body_fat ? parseFloat(healthForm.body_fat) : null,
          notes: healthForm.notes
        }
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        const typeText = healthForm.type === 'exercise' ? '运动' : healthForm.type === 'sleep' ? '睡眠' : '体重'
        const successMessage: Message = {
          id: Date.now().toString(),
          content: `💪 ${typeText}数据已成功记录！今天的健康打卡完成。`,
          sender: 'ai',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, successMessage])
        
        setHealthForm({
          type: 'exercise',
          exercise_type: '', duration: '', distance: '', calories: '',
          bedtime: '', wake_time: '', sleep_duration: '', sleep_quality: 'good',
          weight: '', body_fat: '', notes: ''
        })
        setShowHealthModal(false)
      } else {
        throw new Error(data.error || '记录健康数据失败')
      }
    } catch (error) {
      console.error('记录健康数据失败:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `❌ 记录健康数据失败：${error instanceof Error ? error.message : '未知错误'}`,
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateAIResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase()
    
    if (lowerInput.includes('记录')) {
      return '好的，我可以帮您记录内容。请告诉我您想要记录什么，我会自动为您分类和添加标签。'
    }
    if (lowerInput.includes('提醒')) {
      return '我来帮您设置提醒。请告诉我提醒的内容和时间，我会为您创建智能提醒。'
    }
    if (lowerInput.includes('计划')) {
      return '很好！制定计划是实现目标的重要步骤。请描述您的目标，我会帮您制定详细的执行计划。'
    }
    if (lowerInput.includes('健康')) {
      return '健康管理很重要！我可以帮您记录运动、睡眠、饮食等数据，并提供个性化的健康建议。'
    }
    
    return '我理解了您的需求。作为您的个人AI助手，我可以帮您管理生活的各个方面。请告诉我具体需要什么帮助？'
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">主控制台</h1>
          <p className="text-gray-600 mt-1">您的智能生活助手</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI对话界面 */}
        <div className="lg:col-span-2 order-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[500px] flex flex-col">
            {/* 对话标题 */}
            <div className="flex items-center p-4 border-b border-gray-200">
              <MessageCircle className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">AI助手对话</h2>
            </div>

            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.sender === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                      message.sender === 'user'
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    )}
                  >
                    <MemoizedMarkdown content={message.content} />
                    <p className={cn(
                      "text-xs mt-1",
                      message.sender === 'user' ? "text-blue-100" : "text-gray-500"
                    )}>
                      {message.timestamp.toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-500">AI正在思考...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 输入区域 */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="输入消息或语音输入..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={handleVoiceRecord}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    isRecording
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧面板 */}
        <div className="lg:col-span-1 order-2 space-y-4">
          {/* 今日概览 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">今日概览</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-orange-500 mr-2" />
                  <span className="text-sm text-gray-600">待处理提醒</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">{todayOverview.reminders}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Target className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-600">任务进度</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {todayOverview.completedTasks}/{todayOverview.totalTasks}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-sm text-gray-600">健康评分</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">{todayOverview.healthScore}%</span>
              </div>
              
              {/* 进度条 */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>今日完成度</span>
                  <span>{Math.round((todayOverview.completedTasks / todayOverview.totalTasks) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(todayOverview.completedTasks / todayOverview.totalTasks) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h3>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-left"
                  >
                    <div className={cn("p-2 rounded-lg mr-3", action.color)}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{action.title}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* AI洞察面板 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Brain className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">AI洞察</h3>
              </div>
              <button
                onClick={() => setShowInsightsPanel(!showInsightsPanel)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showInsightsPanel ? '收起' : '展开'}
              </button>
            </div>

            {/* 对话统计 */}
            {conversationStats && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <History className="h-4 w-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">对话统计</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-600">总对话: {conversationStats.totalConversations}</div>
                  <div className="text-gray-600">今日: {conversationStats.todayConversations}</div>
                </div>
              </div>
            )}

            {/* 最新洞察 */}
            <div className="space-y-3">
              {insights.slice(0, showInsightsPanel ? insights.length : 2).map((insight, index) => (
                <div key={index} className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                  <div className="flex items-start">
                    <TrendingUp className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">{insight.title}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2">{insight.description}</p>
                      <div className="flex items-center mt-2">
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          {insight.category}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {insight.insight_type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {insights.length === 0 && (
                <div className="text-center py-4">
                  <Brain className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">暂无数据洞察</p>
                  <button
                    onClick={generateInsights}
                    disabled={isGeneratingInsights}
                    className={`text-xs mt-1 px-3 py-1 rounded-full transition-colors ${
                      isGeneratingInsights 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    {isGeneratingInsights ? '生成中...' : '生成洞察'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 智能推荐 */}
          {recommendations.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center mb-4">
                <Lightbulb className="h-5 w-5 text-yellow-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">智能推荐</h3>
              </div>
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">{rec.title}</h4>
                        <p className="text-xs text-gray-600 line-clamp-2">{rec.description}</p>
                        <div className="flex items-center mt-2">
                          <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                            优先级: {rec.priority}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1 ml-2">
                        <button
                          onClick={() => updateRecommendationStatus(rec.id, 'accepted')}
                          className="text-xs text-green-600 hover:text-green-700"
                        >
                          接受
                        </button>
                        <button
                          onClick={() => updateRecommendationStatus(rec.id, 'dismissed')}
                          className="text-xs text-gray-500 hover:text-gray-600"
                        >
                          忽略
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 用户记忆摘要 */}
          {userMemories.length > 0 && showInsightsPanel && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center mb-4">
                <Brain className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">记忆档案</h3>
              </div>
              <div className="space-y-2">
                {userMemories.slice(0, 5).map((memory, index) => (
                  <div key={index} className="p-2 bg-indigo-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-indigo-700">
                        {memory.memory_type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(memory.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                      {memory.key}: {JSON.stringify(memory.value).slice(0, 50)}...
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 快速记录弹窗 */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">快速记录</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  记录内容
                </label>
                <textarea
                  value={recordForm.content}
                  onChange={(e) => setRecordForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="输入要记录的内容..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  记录类型
                </label>
                <select
                  value={recordForm.type}
                  onChange={(e) => setRecordForm(prev => ({ ...prev, type: e.target.value as 'text' | 'voice' | 'image' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="text">文本</option>
                  <option value="voice">语音</option>
                  <option value="image">图片</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签（可选）
                </label>
                <input
                  type="text"
                  placeholder="输入标签，用逗号分隔"
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    setRecordForm(prev => ({ ...prev, tags }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRecordModal(false)
                  setRecordForm({ content: '', type: 'text', tags: [] })
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                onClick={handleRecordSubmit}
                disabled={!recordForm.content.trim() || isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? '保存中...' : '保存记录'}
              </button>
            </div>
          </div>
        </div>
       )}

      {/* 添加提醒弹窗 */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">添加提醒</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  提醒标题 *
                </label>
                <input
                  type="text"
                  value={reminderForm.title}
                  onChange={(e) => setReminderForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="输入提醒标题..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  提醒时间 *
                </label>
                <input
                  type="datetime-local"
                  value={reminderForm.remind_time}
                  onChange={(e) => setReminderForm(prev => ({ ...prev, remind_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  优先级
                </label>
                <select
                  value={reminderForm.priority}
                  onChange={(e) => setReminderForm(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述（可选）
                </label>
                <textarea
                  value={reminderForm.description}
                  onChange={(e) => setReminderForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="输入提醒描述..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowReminderModal(false)
                  setReminderForm({ title: '', description: '', remind_time: '', priority: 'medium' })
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                onClick={handleReminderSubmit}
                disabled={!reminderForm.title.trim() || !reminderForm.remind_time || isSubmitting}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? '创建中...' : '创建提醒'}
              </button>
            </div>
          </div>
        </div>
       )}

      {/* 创建计划弹窗 */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">创建计划</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  计划标题 *
                </label>
                <input
                  type="text"
                  value={planForm.title}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="输入计划标题..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  计划分类
                </label>
                <select
                  value={planForm.category}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, category: e.target.value as 'personal' | 'work' | 'health' | 'learning' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="personal">个人</option>
                  <option value="work">工作</option>
                  <option value="health">健康</option>
                  <option value="learning">学习</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={planForm.start_date}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={planForm.end_date}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={planForm.start_date}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  计划描述（可选）
                </label>
                <textarea
                  value={planForm.description}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="输入计划描述..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPlanModal(false)
                  setPlanForm({ title: '', description: '', category: 'personal', start_date: '', end_date: '' })
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                onClick={handlePlanSubmit}
                disabled={!planForm.title.trim() || isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? '创建中...' : '创建计划'}
              </button>
            </div>
          </div>
        </div>
       )}

      {/* 健康打卡弹窗 */}
      {showHealthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">健康打卡</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  数据类型
                </label>
                <select
                  value={healthForm.type}
                  onChange={(e) => setHealthForm(prev => ({ ...prev, type: e.target.value as 'exercise' | 'sleep' | 'weight' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="exercise">运动数据</option>
                  <option value="sleep">睡眠数据</option>
                  <option value="weight">体重数据</option>
                </select>
              </div>
              
              {/* 运动数据表单 */}
              {healthForm.type === 'exercise' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      运动类型 *
                    </label>
                    <input
                      type="text"
                      value={healthForm.exercise_type}
                      onChange={(e) => setHealthForm(prev => ({ ...prev, exercise_type: e.target.value }))}
                      placeholder="如：跑步、游泳、健身等"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        时长(分钟) *
                      </label>
                      <input
                        type="number"
                        value={healthForm.duration}
                        onChange={(e) => setHealthForm(prev => ({ ...prev, duration: e.target.value }))}
                        placeholder="30"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        距离(公里)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={healthForm.distance}
                        onChange={(e) => setHealthForm(prev => ({ ...prev, distance: e.target.value }))}
                        placeholder="5.0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      消耗卡路里
                    </label>
                    <input
                      type="number"
                      value={healthForm.calories}
                      onChange={(e) => setHealthForm(prev => ({ ...prev, calories: e.target.value }))}
                      placeholder="300"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
              
              {/* 睡眠数据表单 */}
              {healthForm.type === 'sleep' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        就寝时间 *
                      </label>
                      <input
                        type="time"
                        value={healthForm.bedtime}
                        onChange={(e) => setHealthForm(prev => ({ ...prev, bedtime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        起床时间 *
                      </label>
                      <input
                        type="time"
                        value={healthForm.wake_time}
                        onChange={(e) => setHealthForm(prev => ({ ...prev, wake_time: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        睡眠时长(小时) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={healthForm.sleep_duration}
                        onChange={(e) => setHealthForm(prev => ({ ...prev, sleep_duration: e.target.value }))}
                        placeholder="8.0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        睡眠质量
                      </label>
                      <select
                        value={healthForm.sleep_quality}
                        onChange={(e) => setHealthForm(prev => ({ ...prev, sleep_quality: e.target.value as 'poor' | 'fair' | 'good' | 'excellent' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="poor">差</option>
                        <option value="fair">一般</option>
                        <option value="good">良好</option>
                        <option value="excellent">优秀</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              
              {/* 体重数据表单 */}
              {healthForm.type === 'weight' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        体重(kg) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={healthForm.weight}
                        onChange={(e) => setHealthForm(prev => ({ ...prev, weight: e.target.value }))}
                        placeholder="65.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        体脂率(%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={healthForm.body_fat}
                        onChange={(e) => setHealthForm(prev => ({ ...prev, body_fat: e.target.value }))}
                        placeholder="15.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注（可选）
                </label>
                <textarea
                  value={healthForm.notes}
                  onChange={(e) => setHealthForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="记录今天的感受或其他信息..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowHealthModal(false)
                  setHealthForm({
                    type: 'exercise',
                    exercise_type: '', duration: '', distance: '', calories: '',
                    bedtime: '', wake_time: '', sleep_duration: '', sleep_quality: 'good',
                    weight: '', body_fat: '', notes: ''
                  })
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                onClick={handleHealthSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? '记录中...' : '记录数据'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    )
  }