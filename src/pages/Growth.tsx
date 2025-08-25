import { useState, useEffect } from 'react'
import { Target, TrendingUp, Calendar, Award, BookOpen, Briefcase, Heart, Dumbbell, Plus, X, Edit, Trash2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PieChart, Pie, Cell } from 'recharts'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Goal {
  id: string
  title: string
  description?: string
  category: 'personal' | 'work' | 'study' | 'health' | 'skill'
  target_value: number
  current_value: number
  unit: string
  deadline?: string
  status: 'active' | 'completed' | 'paused'
  created_at: string
}

interface GrowthStats {
  totalGoals: number
  completedGoals: number
  activeGoals: number
  completionRate: number
  categoryBreakdown: { [key: string]: number }
  monthlyProgress: { month: string; completed: number; created: number }[]
}

const categoryLabels = {
  personal: '个人发展',
  work: '工作职业',
  study: '学习教育',
  health: '健康生活',
  skill: '技能提升'
}

const categoryIcons = {
  personal: Target,
  work: Briefcase,
  study: BookOpen,
  health: Heart,
  skill: Award
}

const categoryColors = {
  personal: '#3B82F6',
  work: '#10B981',
  study: '#F59E0B',
  health: '#EF4444',
  skill: '#8B5CF6'
}

// 模拟数据
const mockGoals: Goal[] = [
  {
    id: '1',
    title: '阅读书籍',
    description: '今年阅读24本书籍，提升知识储备',
    category: 'study',
    target_value: 24,
    current_value: 8,
    unit: '本',
    deadline: '2024-12-31',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: '减重目标',
    description: '健康减重10公斤',
    category: 'health',
    target_value: 10,
    current_value: 3.5,
    unit: 'kg',
    deadline: '2024-06-30',
    status: 'active',
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: '3',
    title: '学习编程',
    description: '掌握React和TypeScript',
    category: 'skill',
    target_value: 100,
    current_value: 65,
    unit: '%',
    status: 'active',
    created_at: '2024-02-01T00:00:00Z'
  }
]

const mockStats: GrowthStats = {
  totalGoals: 8,
  completedGoals: 3,
  activeGoals: 5,
  completionRate: 37.5,
  categoryBreakdown: {
    study: 3,
    health: 2,
    skill: 2,
    work: 1
  },
  monthlyProgress: [
    { month: '1月', completed: 1, created: 2 },
    { month: '2月', completed: 0, created: 3 },
    { month: '3月', completed: 2, created: 1 },
    { month: '4月', completed: 0, created: 2 }
  ]
}

export default function Growth() {
  const [goals, setGoals] = useState<Goal[]>(mockGoals)
  const [stats, setStats] = useState<GrowthStats>(mockStats)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal' as keyof typeof categoryLabels,
    target_value: 0,
    unit: '',
    deadline: ''
  })

  // 创建或更新目标
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('请输入目标标题')
      return
    }

    const newGoal: Goal = {
      id: editingGoal ? editingGoal.id : Date.now().toString(),
      title: formData.title,
      description: formData.description,
      category: formData.category,
      target_value: formData.target_value,
      current_value: editingGoal ? editingGoal.current_value : 0,
      unit: formData.unit,
      deadline: formData.deadline,
      status: 'active',
      created_at: editingGoal ? editingGoal.created_at : new Date().toISOString()
    }

    if (editingGoal) {
      setGoals(prev => prev.map(goal => goal.id === editingGoal.id ? newGoal : goal))
      toast.success('目标更新成功')
    } else {
      setGoals(prev => [...prev, newGoal])
      toast.success('目标创建成功')
    }

    setShowModal(false)
    setEditingGoal(null)
    resetForm()
  }

  // 更新目标进度
  const updateProgress = (goalId: string, newValue: number) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        const updatedGoal = { ...goal, current_value: newValue }
        if (newValue >= goal.target_value) {
          updatedGoal.status = 'completed'
          toast.success('恭喜！目标已完成！')
        }
        return updatedGoal
      }
      return goal
    }))
  }

  // 删除目标
  const handleDelete = (goalId: string) => {
    if (!confirm('确定要删除这个目标吗？')) return
    setGoals(prev => prev.filter(goal => goal.id !== goalId))
    toast.success('目标删除成功')
  }

  // 编辑目标
  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setFormData({
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      target_value: goal.target_value,
      unit: goal.unit,
      deadline: goal.deadline || ''
    })
    setShowModal(true)
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'personal',
      target_value: 0,
      unit: '',
      deadline: ''
    })
  }

  // 打开新建模态框
  const handleAdd = () => {
    setEditingGoal(null)
    resetForm()
    setShowModal(true)
  }

  // 筛选目标
  const filteredGoals = selectedCategory === 'all' 
    ? goals 
    : goals.filter(goal => goal.category === selectedCategory)

  // 准备图表数据
  const pieData = Object.entries(stats.categoryBreakdown).map(([category, count]) => ({
    name: categoryLabels[category as keyof typeof categoryLabels] || category,
    value: count,
    fill: categoryColors[category as keyof typeof categoryColors] || '#8884d8'
  }))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">成长规划</h1>
          <p className="text-gray-600 mt-1">设定目标，追踪个人成长进度</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          新建目标
        </button>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总目标数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalGoals}</p>
            </div>
            <Target className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">已完成</p>
              <p className="text-2xl font-bold text-green-600">{stats.completedGoals}</p>
            </div>
            <Award className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">进行中</p>
              <p className="text-2xl font-bold text-orange-600">{stats.activeGoals}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">完成率</p>
              <p className="text-2xl font-bold text-purple-600">{stats.completionRate}%</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-purple-600"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 月度进展 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">月度进展</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthlyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#10B981" name="已完成" strokeWidth={2} />
                <Line type="monotone" dataKey="created" stroke="#3B82F6" name="新创建" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 分类分布 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">目标分类分布</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              selectedCategory === 'all'
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            全部
          </button>
          {Object.entries(categoryLabels).map(([key, label]) => {
            const Icon = categoryIcons[key as keyof typeof categoryIcons]
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={cn(
                  "flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  selectedCategory === key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 目标列表 */}
      <div className="space-y-4">
        {filteredGoals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无目标</h3>
            <p className="text-gray-600 mb-4">创建您的第一个成长目标</p>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              创建目标
            </button>
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const Icon = categoryIcons[goal.category]
            const progress = (goal.current_value / goal.target_value) * 100
            const isCompleted = goal.status === 'completed'
            const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && !isCompleted
            
            return (
              <div key={goal.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isCompleted ? "bg-green-100" : "bg-gray-100"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        isCompleted ? "text-green-600" : "text-gray-600"
                      )} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={cn(
                          "text-lg font-semibold",
                          isCompleted ? "text-green-700 line-through" : "text-gray-900"
                        )}>
                          {goal.title}
                        </h3>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          isCompleted ? "bg-green-100 text-green-800" :
                          isOverdue ? "bg-red-100 text-red-800" :
                          "bg-blue-100 text-blue-800"
                        )}>
                          {isCompleted ? '已完成' : isOverdue ? '已逾期' : '进行中'}
                        </span>
                      </div>
                      
                      {goal.description && (
                        <p className="text-gray-600 mb-3">{goal.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <span>{categoryLabels[goal.category]}</span>
                        {goal.deadline && (
                          <>
                            <span>•</span>
                            <span>截止: {new Date(goal.deadline).toLocaleDateString('zh-CN')}</span>
                          </>
                        )}
                      </div>
                      
                      {/* 进度条 */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">进度</span>
                          <span className="text-sm text-gray-500">
                            {goal.current_value} / {goal.target_value} {goal.unit}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={cn(
                              "h-2 rounded-full transition-all duration-300",
                              isCompleted ? "bg-green-500" : "bg-blue-600"
                            )}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
                          {!isCompleted && (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={goal.current_value}
                                onChange={(e) => updateProgress(goal.id, Number(e.target.value))}
                                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                min="0"
                                max={goal.target_value}
                                step={goal.unit === '%' ? 1 : 0.1}
                              />
                              <span className="text-xs text-gray-500">{goal.unit}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="编辑"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 创建/编辑目标模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingGoal ? '编辑目标' : '新建目标'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingGoal(null)
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
                  目标标题 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入目标标题"
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
                  placeholder="输入目标描述"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    目标值 *
                  </label>
                  <input
                    type="number"
                    value={formData.target_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_value: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    单位 *
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="如：本、kg、%"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  截止日期
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingGoal(null)
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
                  {editingGoal ? '更新' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}