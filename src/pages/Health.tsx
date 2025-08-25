import { useState, useEffect } from 'react'
import { Heart, Activity, Scale, Droplets, Moon, Apple, Plus, X, Trash2, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface HealthData {
  id: string
  data_type: 'exercise' | 'weight' | 'blood_pressure' | 'sleep' | 'nutrition'
  data_value: any
  record_date: string
  notes?: string
  created_at: string
}

interface HealthSummary {
  exercise: { count: number; avgDuration: number }
  weight: { count: number; latest: number; trend: 'increasing' | 'decreasing' | 'stable' }
  bloodPressure: { count: number; avgSystolic: number; avgDiastolic: number }
  sleep: { count: number; avgDuration: number }
  nutrition: { count: number; avgCalories: number }
}

const dataTypeLabels = {
  exercise: '运动记录',
  weight: '体重记录',
  blood_pressure: '血压记录',
  sleep: '睡眠记录',
  nutrition: '营养记录'
}

const dataTypeIcons = {
  exercise: Activity,
  weight: Scale,
  blood_pressure: Droplets,
  sleep: Moon,
  nutrition: Apple
}

// 模拟数据
const mockHealthData: HealthData[] = [
  {
    id: '1',
    data_type: 'exercise',
    data_value: { type: '跑步', duration: 30, distance: 5, calories: 300 },
    record_date: '2024-01-15',
    notes: '晨跑，感觉很好',
    created_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '2',
    data_type: 'weight',
    data_value: { weight: 70, body_fat: 15, bmi: 22.5 },
    record_date: '2024-01-15',
    created_at: '2024-01-15T07:00:00Z'
  },
  {
    id: '3',
    data_type: 'blood_pressure',
    data_value: { systolic: 120, diastolic: 80, pulse: 72 },
    record_date: '2024-01-14',
    created_at: '2024-01-14T18:00:00Z'
  }
]

const mockSummary: HealthSummary = {
  exercise: { count: 12, avgDuration: 35 },
  weight: { count: 8, latest: 70, trend: 'stable' },
  bloodPressure: { count: 5, avgSystolic: 118, avgDiastolic: 78 },
  sleep: { count: 15, avgDuration: 7.5 },
  nutrition: { count: 20, avgCalories: 2200 }
}

export default function Health() {
  const [healthData, setHealthData] = useState<HealthData[]>(mockHealthData)
  const [summary, setSummary] = useState<HealthSummary>(mockSummary)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedDataType, setSelectedDataType] = useState<string>('exercise')
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d')
  const [formData, setFormData] = useState<any>({})

  // 获取健康数据
  const fetchHealthData = async () => {
    setLoading(true)
    try {
      // 模拟API调用
      setTimeout(() => {
        setHealthData(mockHealthData)
        setSummary(mockSummary)
        setLoading(false)
      }, 500)
    } catch (error) {
      toast.error('获取健康数据失败')
      setLoading(false)
    }
  }

  // 提交健康数据
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newData: HealthData = {
      id: Date.now().toString(),
      data_type: selectedDataType as any,
      data_value: formData,
      record_date: formData.record_date || new Date().toISOString().split('T')[0],
      notes: formData.notes,
      created_at: new Date().toISOString()
    }

    setHealthData(prev => [newData, ...prev])
    setShowModal(false)
    setFormData({})
    toast.success('健康数据记录成功')
  }

  // 删除健康数据
  const handleDelete = (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return
    setHealthData(prev => prev.filter(item => item.id !== id))
    toast.success('记录删除成功')
  }

  // 打开添加数据模态框
  const handleAddData = (dataType: string) => {
    setSelectedDataType(dataType)
    setFormData({})
    setShowModal(true)
  }

  // 渲染表单字段
  const renderFormFields = () => {
    switch (selectedDataType) {
      case 'exercise':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">运动类型</label>
              <input
                type="text"
                value={formData.type || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="如：跑步、游泳、健身"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">时长(分钟)</label>
                <input
                  type="number"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">距离(公里)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.distance || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, distance: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">消耗卡路里</label>
              <input
                type="number"
                value={formData.calories || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, calories: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>
          </>
        )
      
      case 'weight':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">体重(kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">体脂率(%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.body_fat || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, body_fat: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">BMI</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.bmi || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, bmi: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>
          </>
        )
      
      case 'blood_pressure':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">收缩压</label>
                <input
                  type="number"
                  value={formData.systolic || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, systolic: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">舒张压</label>
                <input
                  type="number"
                  value={formData.diastolic || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, diastolic: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">脉搏(次/分)</label>
              <input
                type="number"
                value={formData.pulse || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, pulse: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>
          </>
        )
      
      default:
        return null
    }
  }

  useEffect(() => {
    fetchHealthData()
  }, [selectedPeriod])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">健康管理</h1>
          <p className="text-gray-600 mt-1">记录和追踪您的健康数据</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
            <option value="90d">最近90天</option>
          </select>
        </div>
      </div>

      {/* 统计卡片 */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">运动次数</p>
                <p className="text-xl font-bold text-blue-600">{summary.exercise.count}</p>
                <p className="text-xs text-gray-500">平均{Math.round(summary.exercise.avgDuration)}分钟</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">睡眠记录</p>
                <p className="text-xl font-bold text-purple-600">{summary.sleep.count}</p>
                <p className="text-xs text-gray-500">平均{Math.round(summary.sleep.avgDuration)}小时</p>
              </div>
              <Moon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">当前体重</p>
                <p className="text-xl font-bold text-green-600">
                  {summary.weight.latest ? `${summary.weight.latest}kg` : '--'}
                </p>
                <p className="text-xs text-gray-500">
                  {summary.weight.trend === 'increasing' ? '↗ 上升' :
                   summary.weight.trend === 'decreasing' ? '↘ 下降' : '→ 稳定'}
                </p>
              </div>
              <Scale className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">血压记录</p>
                <p className="text-xl font-bold text-red-600">{summary.bloodPressure.count}</p>
                <p className="text-xs text-gray-500">
                  {summary.bloodPressure.avgSystolic > 0 ? 
                    `${Math.round(summary.bloodPressure.avgSystolic)}/${Math.round(summary.bloodPressure.avgDiastolic)}` : '--'}
                </p>
              </div>
              <Droplets className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">营养记录</p>
                <p className="text-xl font-bold text-orange-600">{summary.nutrition.count}</p>
                <p className="text-xs text-gray-500">
                  {summary.nutrition.avgCalories > 0 ? `${Math.round(summary.nutrition.avgCalories)}卡` : '--'}
                </p>
              </div>
              <Apple className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* 快捷录入 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">快捷录入</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <button
            onClick={() => handleAddData('exercise')}
            className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Activity className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">运动记录</span>
          </button>
          
          <button
            onClick={() => handleAddData('weight')}
            className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <Scale className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">体重记录</span>
          </button>
          
          <button
            onClick={() => handleAddData('blood_pressure')}
            className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
          >
            <Droplets className="h-8 w-8 text-red-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">血压记录</span>
          </button>
          
          <button
            onClick={() => handleAddData('sleep')}
            className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <Moon className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">睡眠记录</span>
          </button>
          
          <button
            onClick={() => handleAddData('nutrition')}
            className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <Apple className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">营养记录</span>
          </button>
        </div>
      </div>

      {/* 健康数据列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">健康记录</h3>
        </div>
        
        {healthData.length === 0 ? (
          <div className="p-12 text-center">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无健康数据</h3>
            <p className="text-gray-600 mb-4">开始记录您的健康数据</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {healthData.map((item) => {
              const Icon = dataTypeIcons[item.data_type]
              return (
                <div key={item.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {dataTypeLabels[item.data_type]}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {new Date(item.record_date).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          {item.data_type === 'exercise' && (
                            <div>
                              <span className="font-medium">{item.data_value.type}</span>
                              <span className="mx-2">•</span>
                              <span>{item.data_value.duration}分钟</span>
                              {item.data_value.distance && (
                                <><span className="mx-2">•</span><span>{item.data_value.distance}公里</span></>
                              )}
                              {item.data_value.calories && (
                                <><span className="mx-2">•</span><span>{item.data_value.calories}卡</span></>
                              )}
                            </div>
                          )}
                          
                          {item.data_type === 'weight' && (
                            <div>
                              <span className="font-medium">{item.data_value.weight}kg</span>
                              {item.data_value.body_fat && (
                                <><span className="mx-2">•</span><span>体脂率 {item.data_value.body_fat}%</span></>
                              )}
                              {item.data_value.bmi && (
                                <><span className="mx-2">•</span><span>BMI {item.data_value.bmi}</span></>
                              )}
                            </div>
                          )}
                          
                          {item.data_type === 'blood_pressure' && (
                            <div>
                              <span className="font-medium">
                                {item.data_value.systolic}/{item.data_value.diastolic} mmHg
                              </span>
                              {item.data_value.pulse && (
                                <><span className="mx-2">•</span><span>心率 {item.data_value.pulse}次/分</span></>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 录入数据模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                录入{dataTypeLabels[selectedDataType as keyof typeof dataTypeLabels]}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setFormData({})
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">记录日期</label>
                <input
                  type="date"
                  value={formData.record_date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData(prev => ({ ...prev, record_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {renderFormFields()}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="添加备注信息"
                  rows={2}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setFormData({})
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}