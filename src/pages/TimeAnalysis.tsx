import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'
import { Activity, Calendar, TrendingUp, Clock, BarChart3, PieChart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface TimeStats {
  totalRecords: number
  totalPlans: number
  completedPlans: number
  totalReminders: number
  completedReminders: number
  productivityScore: number
  weeklyActivity: { day: string; records: number; plans: number; reminders: number }[]
  categoryBreakdown: { [key: string]: number }
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

// 模拟数据
const mockTimeStats: TimeStats = {
  totalRecords: 156,
  totalPlans: 24,
  completedPlans: 18,
  totalReminders: 45,
  completedReminders: 38,
  productivityScore: 78,
  weeklyActivity: [
    { day: '周一', records: 25, plans: 4, reminders: 8 },
    { day: '周二', records: 22, plans: 3, reminders: 6 },
    { day: '周三', records: 28, plans: 5, reminders: 7 },
    { day: '周四', records: 20, plans: 2, reminders: 5 },
    { day: '周五', records: 24, plans: 4, reminders: 9 },
    { day: '周六', records: 18, plans: 3, reminders: 5 },
    { day: '周日', records: 19, plans: 3, reminders: 5 }
  ],
  categoryBreakdown: {
    work: 45,
    study: 28,
    personal: 35,
    health: 22,
    other: 26
  }
}

export default function TimeAnalysis() {
  const [timeStats, setTimeStats] = useState<TimeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week')

  // 获取时间统计数据
  const fetchTimeStats = async () => {
    setLoading(true)
    try {
      // 模拟API调用
      setTimeout(() => {
        setTimeStats(mockTimeStats)
        setLoading(false)
      }, 500)
    } catch (error) {
      toast.error('获取时间统计失败')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTimeStats()
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

  if (!timeStats) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无数据</h3>
          <p className="text-gray-600">开始记录您的活动以查看分析</p>
        </div>
      </div>
    )
  }

  // 准备饼图数据
  const pieData = Object.entries(timeStats.categoryBreakdown).map(([category, count]) => ({
    name: category === 'personal' ? '个人' :
          category === 'work' ? '工作' :
          category === 'study' ? '学习' :
          category === 'health' ? '健康' : '其他',
    value: count
  }))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">时间分析</h1>
          <p className="text-gray-600 mt-1">分析您的时间使用情况和效率</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">本周</option>
            <option value="month">本月</option>
            <option value="year">本年</option>
          </select>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总记录数</p>
              <p className="text-2xl font-bold text-gray-900">{timeStats.totalRecords}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">完成计划</p>
              <p className="text-2xl font-bold text-green-600">
                {timeStats.completedPlans}/{timeStats.totalPlans}
              </p>
            </div>
            <Clock className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">完成提醒</p>
              <p className="text-2xl font-bold text-yellow-600">
                {timeStats.completedReminders}/{timeStats.totalReminders}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">生产力评分</p>
              <p className={cn(
                "text-2xl font-bold",
                timeStats.productivityScore >= 80 ? "text-green-600" :
                timeStats.productivityScore >= 60 ? "text-yellow-600" : "text-red-600"
              )}>
                {timeStats.productivityScore}/100
              </p>
            </div>
            <TrendingUp className={cn(
              "h-8 w-8",
              timeStats.productivityScore >= 80 ? "text-green-600" :
              timeStats.productivityScore >= 60 ? "text-yellow-600" : "text-red-600"
            )} />
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 周活动图表 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">周活动统计</h3>
            <BarChart3 className="h-5 w-5 text-gray-500" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeStats.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="records" fill="#3B82F6" name="记录" />
                <Bar dataKey="plans" fill="#10B981" name="计划" />
                <Bar dataKey="reminders" fill="#F59E0B" name="提醒" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 分类分布饼图 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">活动分类分布</h3>
            <PieChart className="h-5 w-5 text-gray-500" />
          </div>
          {pieData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Tooltip />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">暂无分类数据</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 详细统计 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">详细统计</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{timeStats.totalRecords}</div>
            <div className="text-sm text-gray-600">总记录数</div>
            <div className="text-xs text-gray-500 mt-1">包括所有类型的记录</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {timeStats.completedPlans}/{timeStats.totalPlans}
            </div>
            <div className="text-sm text-gray-600">已完成计划</div>
            <div className="text-xs text-gray-500 mt-1">
              完成率 {timeStats.totalPlans > 0 ? Math.round((timeStats.completedPlans / timeStats.totalPlans) * 100) : 0}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {timeStats.completedReminders}/{timeStats.totalReminders}
            </div>
            <div className="text-sm text-gray-600">已完成提醒</div>
            <div className="text-xs text-gray-500 mt-1">
              完成率 {timeStats.totalReminders > 0 ? Math.round((timeStats.completedReminders / timeStats.totalReminders) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* 生产力洞察 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-6 w-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">生产力洞察</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">本周表现</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">生产力评分</span>
                <span className={cn(
                  "font-medium",
                  timeStats.productivityScore >= 80 ? "text-green-600" :
                  timeStats.productivityScore >= 60 ? "text-yellow-600" : "text-red-600"
                )}>
                  {timeStats.productivityScore}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    timeStats.productivityScore >= 80 ? "bg-green-500" :
                    timeStats.productivityScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${timeStats.productivityScore}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">改进建议</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {timeStats.productivityScore < 60 && (
                <li>• 尝试设定更具体和可实现的目标</li>
              )}
              {timeStats.totalPlans === 0 && (
                <li>• 创建一些计划来更好地组织您的时间</li>
              )}
              {timeStats.completedReminders / timeStats.totalReminders < 0.7 && (
                <li>• 提高提醒的完成率，养成良好习惯</li>
              )}
              {timeStats.productivityScore >= 80 && (
                <li>• 保持良好的工作节奏！</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}