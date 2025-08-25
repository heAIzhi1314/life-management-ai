import { useState, useEffect } from 'react'
import { Calendar, Plus, CheckCircle, Clock, Tag, BarChart3, Trash2, Edit, X, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Task {
  id: string
  title: string
  description?: string
  due_date?: string
  is_completed: boolean
  order_index: number
  created_at: string
}

interface Plan {
  id: string
  title: string
  description?: string
  category: 'personal' | 'work' | 'study' | 'health' | 'other'
  start_date?: string
  end_date?: string
  status: 'active' | 'completed' | 'archived'
  progress: number
  created_at: string
  tasks?: Task[]
}

interface PlanForm {
  title: string
  description: string
  category: 'personal' | 'work' | 'study' | 'health' | 'other'
  start_date: string
  end_date: string
}

const categoryColors = {
  personal: 'bg-purple-100 text-purple-800 border-purple-200',
  work: 'bg-blue-100 text-blue-800 border-blue-200',
  study: 'bg-green-100 text-green-800 border-green-200',
  health: 'bg-red-100 text-red-800 border-red-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200'
}

const categoryLabels = {
  personal: '个人',
  work: '工作',
  study: '学习',
  health: '健康',
  other: '其他'
}

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formData, setFormData] = useState<PlanForm>({
    title: '',
    description: '',
    category: 'personal',
    start_date: '',
    end_date: ''
  })

  // 获取计划列表
  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('token')
      let url = '/api/plans'
      const queryParams = []
      
      if (categoryFilter !== 'all') {
        queryParams.push(`category=${categoryFilter}`)
      }
      
      if (statusFilter !== 'all') {
        queryParams.push(`status=${statusFilter}`)
      }
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setPlans(data.plans)
      } else {
        toast.error('获取计划失败')
      }
    } catch (error) {
      toast.error('网络错误')
    } finally {
      setLoading(false)
    }
  }

  // 创建或更新计划
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('请输入计划标题')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const url = editingPlan ? `/api/plans/${editingPlan.id}` : '/api/plans'
      const method = editingPlan ? 'PUT' : 'POST'
      
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
        toast.success(editingPlan ? '计划更新成功' : '计划创建成功')
        setShowModal(false)
        setEditingPlan(null)
        resetForm()
        fetchPlans()
      } else {
        toast.error(data.error || '操作失败')
      }
    } catch (error) {
      toast.error('网络错误')
    }
  }

  // 删除计划
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个计划吗？')) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/plans/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success('计划删除成功')
        fetchPlans()
      } else {
        toast.error('删除失败')
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
      category: 'personal',
      start_date: '',
      end_date: ''
    })
  }

  // 编辑计划
  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setFormData({
      title: plan.title,
      description: plan.description || '',
      category: plan.category,
      start_date: plan.start_date || '',
      end_date: plan.end_date || ''
    })
    setShowModal(true)
  }

  // 打开新建模态框
  const handleAdd = () => {
    setEditingPlan(null)
    resetForm()
    setShowModal(true)
  }

  // 筛选计划
  const filteredPlans = plans

  useEffect(() => {
    fetchPlans()
  }, [categoryFilter, statusFilter])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">计划管理</h1>
          <p className="text-gray-600 mt-1">创建和跟踪您的各类计划</p>
        </div>
        <button
           onClick={handleAdd}
           className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
         >
           <Plus className="h-4 w-4 mr-2" />
           新建计划
         </button>
       </div>

       {/* 筛选器 */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
         <div className="flex flex-wrap gap-4">
           <div className="flex items-center space-x-2">
             <Tag className="h-4 w-4 text-gray-500" />
             <span className="text-sm font-medium text-gray-700">分类:</span>
             <select
               value={categoryFilter}
               onChange={(e) => setCategoryFilter(e.target.value)}
               className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             >
               <option value="all">全部</option>
               <option value="personal">个人</option>
               <option value="work">工作</option>
               <option value="study">学习</option>
               <option value="health">健康</option>
               <option value="other">其他</option>
             </select>
           </div>
           
           <div className="flex items-center space-x-2">
             <CheckCircle className="h-4 w-4 text-gray-500" />
             <span className="text-sm font-medium text-gray-700">状态:</span>
             <select
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             >
               <option value="all">全部</option>
               <option value="active">进行中</option>
               <option value="completed">已完成</option>
               <option value="archived">已归档</option>
             </select>
           </div>
         </div>
       </div>

       {/* 计划列表 */}
       <div className="space-y-4">
         {loading ? (
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
             <p className="text-gray-600">加载中...</p>
           </div>
         ) : filteredPlans.length === 0 ? (
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
             <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
             <h3 className="text-lg font-medium text-gray-900 mb-2">暂无计划</h3>
             <p className="text-gray-600 mb-4">创建您的第一个计划</p>
             <button
               onClick={handleAdd}
               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
             >
               创建计划
             </button>
           </div>
         ) : (
           filteredPlans.map((plan) => (
             <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
               <div className="flex items-start justify-between">
                 <div className="flex-1">
                   <div className="flex items-center space-x-3 mb-2">
                     <h3 className="text-lg font-semibold text-gray-900">{plan.title}</h3>
                     <span className={cn(
                       "px-2 py-1 rounded-full text-xs font-medium border",
                       categoryColors[plan.category]
                     )}>
                       {categoryLabels[plan.category]}
                     </span>
                     <span className={cn(
                       "px-2 py-1 rounded-full text-xs font-medium",
                       plan.status === 'active' ? 'bg-green-100 text-green-800' :
                       plan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                       'bg-gray-100 text-gray-800'
                     )}>
                       {plan.status === 'active' ? '进行中' :
                        plan.status === 'completed' ? '已完成' : '已归档'}
                     </span>
                   </div>
                   
                   {plan.description && (
                     <p className="text-gray-600 mb-3">{plan.description}</p>
                   )}
                   
                   <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                     {plan.start_date && (
                       <div className="flex items-center">
                         <Clock className="h-4 w-4 mr-1" />
                         开始: {new Date(plan.start_date).toLocaleDateString('zh-CN')}
                       </div>
                     )}
                     {plan.end_date && (
                       <div className="flex items-center">
                         <Clock className="h-4 w-4 mr-1" />
                         结束: {new Date(plan.end_date).toLocaleDateString('zh-CN')}
                       </div>
                     )}
                   </div>
                   
                   {/* 进度条 */}
                   <div className="mb-3">
                     <div className="flex items-center justify-between mb-1">
                       <span className="text-sm font-medium text-gray-700">进度</span>
                       <span className="text-sm text-gray-500">{plan.progress}%</span>
                     </div>
                     <div className="w-full bg-gray-200 rounded-full h-2">
                       <div 
                         className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                         style={{ width: `${plan.progress}%` }}
                       ></div>
                     </div>
                   </div>
                 </div>
                 
                 <div className="flex items-center space-x-2 ml-4">
                   <button
                     onClick={() => handleEdit(plan)}
                     className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                     title="编辑"
                   >
                     <Edit className="h-4 w-4" />
                   </button>
                   
                   <button
                     onClick={() => handleDelete(plan.id)}
                     className="p-2 text-gray-400 hover:text-red-600 transition-colors"
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

        {/* 创建/编辑计划模态框 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingPlan ? '编辑计划' : '新建计划'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingPlan(null)
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
                    计划标题 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="输入计划标题"
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
                    placeholder="输入计划描述"
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
                    <option value="personal">个人</option>
                    <option value="work">工作</option>
                    <option value="study">学习</option>
                    <option value="health">健康</option>
                    <option value="other">其他</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      开始日期
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      结束日期
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingPlan(null)
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
                    {editingPlan ? '更新' : '创建'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }