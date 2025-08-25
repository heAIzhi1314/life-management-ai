import { useState, useEffect } from 'react'
import { Bell, Plus, Clock, MapPin, Repeat, AlertTriangle, Edit, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Reminder {
  id: string
  title: string
  description?: string
  remind_time?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_completed: boolean
  location_trigger?: any
  repeat_pattern?: string
  created_at: string
}

interface ReminderForm {
  title: string
  description: string
  remind_time: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  repeat_pattern?: string
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800 border-gray-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200'
}

const priorityLabels = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急'
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [formData, setFormData] = useState<ReminderForm>({
    title: '',
    description: '',
    remind_time: '',
    priority: 'medium'
  })

  // 获取提醒列表
  const fetchReminders = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/reminders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setReminders(data.reminders)
      } else {
        toast.error('获取提醒失败')
      }
    } catch (error) {
      toast.error('网络错误')
    } finally {
      setLoading(false)
    }
  }

  // 创建或更新提醒
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('请输入提醒标题')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const url = editingReminder ? `/api/reminders/${editingReminder.id}` : '/api/reminders'
      const method = editingReminder ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success(editingReminder ? '提醒更新成功' : '提醒创建成功')
        setShowModal(false)
        setEditingReminder(null)
        resetForm()
        fetchReminders()
      } else {
        toast.error(data.error || '操作失败')
      }
    } catch (error) {
      toast.error('网络错误')
    }
  }

  // 删除提醒
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个提醒吗？')) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/reminders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success('提醒删除成功')
        fetchReminders()
      } else {
        toast.error('删除失败')
      }
    } catch (error) {
      toast.error('网络错误')
    }
  }

  // 切换完成状态
  const toggleComplete = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/reminders/${id}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (data.success) {
        fetchReminders()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      toast.error('网络错误')
    }
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      remind_time: '',
      priority: 'medium'
    })
  }

  // 编辑提醒
  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder)
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      remind_time: reminder.remind_time ? new Date(reminder.remind_time).toISOString().slice(0, 16) : '',
      priority: reminder.priority
    })
    setShowModal(true)
  }

  // 打开新建模态框
  const handleAdd = () => {
    setEditingReminder(null)
    resetForm()
    setShowModal(true)
  }

  const filteredReminders = reminders.filter(reminder => {
    if (filter === 'pending') return !reminder.is_completed
    if (filter === 'completed') return reminder.is_completed
    return true
  })

  useEffect(() => {
    fetchReminders()
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">提醒管理</h1>
          <p className="text-gray-600 mt-1">管理您的提醒和待办事项</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          新建提醒
        </button>
      </div>

      {/* 筛选器 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex space-x-2">
          {(['all', 'pending', 'completed'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                filter === filterType
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {filterType === 'all' && '全部'}
              {filterType === 'pending' && '待处理'}
              {filterType === 'completed' && '已完成'}
            </button>
          ))}
        </div>
      </div>

      {/* 提醒列表 */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无提醒</h3>
            <p className="text-gray-600 mb-4">创建您的第一个提醒</p>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              创建提醒
            </button>
          </div>
        ) : (
          filteredReminders.map((reminder) => (
            <div key={reminder.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <button
                    onClick={() => toggleComplete(reminder.id)}
                    className={cn(
                      "mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                      reminder.is_completed
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300 hover:border-green-500"
                    )}
                  >
                    {reminder.is_completed && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <h3 className={cn(
                      "text-lg font-semibold",
                      reminder.is_completed ? "text-gray-500 line-through" : "text-gray-900"
                    )}>
                      {reminder.title}
                    </h3>
                    {reminder.description && (
                      <p className={cn(
                        "mt-1 text-sm",
                        reminder.is_completed ? "text-gray-400" : "text-gray-600"
                      )}>
                        {reminder.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 mt-3">
                      {reminder.remind_time && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(reminder.remind_time).toLocaleString('zh-CN')}
                        </div>
                      )}
                      
                      {reminder.location_trigger && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          {reminder.location_trigger.name}
                        </div>
                      )}
                      
                      {reminder.repeat_pattern && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Repeat className="h-4 w-4 mr-1" />
                          重复
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium border",
                    priorityColors[reminder.priority]
                  )}>
                    {priorityLabels[reminder.priority]}
                  </span>
                  
                  {reminder.priority === 'urgent' && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  
                  <button
                    onClick={() => handleEdit(reminder)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="编辑"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(reminder.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 创建/编辑提醒模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingReminder ? '编辑提醒' : '新建提醒'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingReminder(null)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  提醒标题 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入提醒标题"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入提醒描述"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  提醒时间
                </label>
                <input
                  type="datetime-local"
                  value={formData.remind_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, remind_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  优先级
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="urgent">紧急</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingReminder(null)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingReminder ? '更新' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}