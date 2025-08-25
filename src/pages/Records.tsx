import { useState, useEffect } from 'react'
import { Search, Plus, Filter, Tag, Calendar, Mic, FileText, Image, Volume2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useRecords } from '@/contexts/RecordsContext'

interface Record {
  id: string
  content: string
  type: 'text' | 'voice' | 'image'
  tags: string[]
  created_at: string
  updated_at: string
}

const mockRecords: Record[] = [
  {
    id: '1',
    content: '今天和团队讨论了新项目的技术方案，决定使用React + Node.js的技术栈。需要在下周一前完成原型设计。',
    type: 'text',
    tags: ['工作', '项目', '技术'],
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    content: '记得买牛奶、面包和鸡蛋，明天早餐要用。',
    type: 'text',
    tags: ['生活', '购物'],
    created_at: '2024-01-15T14:20:00Z',
    updated_at: '2024-01-15T14:20:00Z'
  },
  {
    id: '3',
    content: '今天跑步5公里，感觉状态不错。明天继续保持运动习惯。',
    type: 'text',
    tags: ['健康', '运动'],
    created_at: '2024-01-15T18:45:00Z',
    updated_at: '2024-01-15T18:45:00Z'
  }
]

const typeIcons = {
  text: FileText,
  voice: Volume2,
  image: Image
}

const typeColors = {
  text: 'text-blue-600 bg-blue-50',
  voice: 'text-green-600 bg-green-50',
  image: 'text-purple-600 bg-purple-50'
}

const tagColors = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-red-100 text-red-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800'
]

export default function Records() {
  const { token } = useAuth()
  const { records, isLoading, refreshRecords, createRecord } = useRecords()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newRecord, setNewRecord] = useState({
    content: '',
    type: 'text' as 'text' | 'voice' | 'image',
    tags: [] as string[]
  })

  // 获取记录数据
  useEffect(() => {
    if (token) {
      refreshRecords()
    }
  }, [token, refreshRecords])

  // 定时刷新机制（每30秒刷新一次）
  useEffect(() => {
    if (!token) return
    
    const interval = setInterval(() => {
      refreshRecords()
    }, 30000) // 30秒
    
    return () => clearInterval(interval)
  }, [token, refreshRecords])

  // 手动刷新
  const handleManualRefresh = async () => {
    await refreshRecords()
  }

  // 获取所有标签
  const allTags = Array.from(new Set(records.flatMap(record => record.tags)))

  // 过滤记录
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'all' || record.type === selectedType
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => record.tags.includes(tag))
    return matchesSearch && matchesType && matchesTags
  })

  const handleAddRecord = async () => {
    if (!newRecord.content.trim()) return

    try {
      setIsSubmitting(true)
      const result = await createRecord({
        content: newRecord.content,
        type: newRecord.type,
        tags: newRecord.tags
      })

      if (result) {
        setNewRecord({ content: '', type: 'text', tags: [] })
        setShowAddModal(false)
      } else {
        console.error('创建记录失败')
      }
    } catch (error) {
      console.error('创建记录错误:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording)
    // TODO: 实现语音录制功能
    if (!isRecording) {
      console.log('开始录音')
    } else {
      console.log('停止录音')
      // 模拟语音转文字
      setNewRecord(prev => ({
        ...prev,
        content: '这是通过语音输入的内容',
        type: 'voice'
      }))
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const addTagToNewRecord = (tag: string) => {
    if (!newRecord.tags.includes(tag)) {
      setNewRecord(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
    }
  }

  const removeTagFromNewRecord = (tag: string) => {
    setNewRecord(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return '刚刚'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">智能记录</h1>
          <p className="text-gray-600 mt-1">记录您的想法、灵感和重要信息</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="flex items-center px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="刷新记录"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            新建记录
          </button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索记录内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 类型筛选 */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">所有类型</option>
              <option value="text">文字记录</option>
              <option value="voice">语音记录</option>
              <option value="image">图片记录</option>
            </select>
          </div>
        </div>

        {/* 标签筛选 */}
        {allTags.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center mb-2">
              <Tag className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">标签筛选：</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag, index) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                    selectedTags.includes(tag)
                      ? "bg-blue-600 text-white"
                      : tagColors[index % tagColors.length]
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 记录列表 */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-gray-600 mt-4">加载记录中...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无记录</h3>
            <p className="text-gray-600 mb-4">开始记录您的想法和重要信息吧</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              创建第一条记录
            </button>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const TypeIcon = typeIcons[record.type]
            return (
              <div key={record.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={cn("p-2 rounded-lg", typeColors[record.type])}>
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-gray-500">
                      {record.type === 'text' && '文字记录'}
                      {record.type === 'voice' && '语音记录'}
                      {record.type === 'image' && '图片记录'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{formatDate(record.created_at)}</span>
                </div>
                
                <p className="text-gray-900 mb-4 leading-relaxed">{record.content}</p>
                
                {record.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {record.tags.map((tag, index) => (
                      <span
                        key={tag}
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          tagColors[index % tagColors.length]
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* 添加记录模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">新建记录</h3>
            
            <div className="space-y-4">
              {/* 记录类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">记录类型</label>
                <div className="flex space-x-2">
                  {(['text', 'voice', 'image'] as const).map((type) => {
                    const Icon = typeIcons[type]
                    return (
                      <button
                        key={type}
                        onClick={() => setNewRecord(prev => ({ ...prev, type }))}
                        className={cn(
                          "flex items-center px-3 py-2 rounded-lg border transition-colors",
                          newRecord.type === type
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {type === 'text' && '文字'}
                        {type === 'voice' && '语音'}
                        {type === 'image' && '图片'}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 记录内容 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">记录内容</label>
                <div className="relative">
                  <textarea
                    value={newRecord.content}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="输入您要记录的内容..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  {newRecord.type === 'voice' && (
                    <button
                      onClick={handleVoiceRecord}
                      className={cn(
                        "absolute bottom-2 right-2 p-2 rounded-lg transition-colors",
                        isRecording
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* 标签 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {allTags.map((tag, index) => (
                    <button
                      key={tag}
                      onClick={() => addTagToNewRecord(tag)}
                      disabled={newRecord.tags.includes(tag)}
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium transition-colors",
                        newRecord.tags.includes(tag)
                          ? "bg-blue-600 text-white"
                          : tagColors[index % tagColors.length] + " hover:opacity-80"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {newRecord.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500">已选择：</span>
                    {newRecord.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          onClick={() => removeTagFromNewRecord(tag)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddRecord}
                disabled={!newRecord.content.trim() || isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                )}
                {isSubmitting ? '保存中...' : '保存记录'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}