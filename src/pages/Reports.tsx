import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { Calendar, TrendingUp, Target, Clock, Heart, Brain, Download, Filter, RefreshCw, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ReportData {
  overview: {
    totalReminders: number
    completedPlans: number
    totalGoals: number
    healthRecords: number
    averageProductivity: number
    weeklyGrowth: number
  }
  timeAnalysis: {
    dailyHours: { day: string; work: number; study: number; rest: number; exercise: number }[]
    weeklyTrend: { week: string; productivity: number; wellness: number }[]
    categoryDistribution: { name: string; value: number; color: string }[]
  }
  goalProgress: {
    categories: { category: string; completed: number; total: number; progress: number }[]
    monthlyCompletion: { month: string; completed: number; created: number }[]
  }
  healthMetrics: {
    weeklyStats: { week: string; exercise: number; sleep: number; nutrition: number }[]
    trends: { metric: string; current: number; previous: number; change: number }[]
  }
  insights: {
    id: string
    type: 'success' | 'warning' | 'info'
    title: string
    description: string
    recommendation?: string
  }[]
}

const mockReportData: ReportData = {
  overview: {
    totalReminders: 45,
    completedPlans: 12,
    totalGoals: 8,
    healthRecords: 28,
    averageProductivity: 78,
    weeklyGrowth: 12
  },
  timeAnalysis: {
    dailyHours: [
      { day: '周一', work: 8, study: 2, rest: 6, exercise: 1 },
      { day: '周二', work: 7, study: 3, rest: 7, exercise: 1.5 },
      { day: '周三', work: 9, study: 1, rest: 5, exercise: 2 },
      { day: '周四', work: 8, study: 2.5, rest: 6.5, exercise: 1 },
      { day: '周五', work: 6, study: 4, rest: 8, exercise: 2 },
      { day: '周六', work: 2, study: 3, rest: 10, exercise: 3 },
      { day: '周日', work: 1, study: 2, rest: 12, exercise: 2 }
    ],
    weeklyTrend: [
      { week: '第1周', productivity: 75, wellness: 68 },
      { week: '第2周', productivity: 82, wellness: 72 },
      { week: '第3周', productivity: 78, wellness: 75 },
      { week: '第4周', productivity: 85, wellness: 80 }
    ],
    categoryDistribution: [
      { name: '工作', value: 45, color: '#3B82F6' },
      { name: '学习', value: 20, color: '#10B981' },
      { name: '休息', value: 25, color: '#F59E0B' },
      { name: '运动', value: 10, color: '#EF4444' }
    ]
  },
  goalProgress: {
    categories: [
      { category: '学习教育', completed: 3, total: 5, progress: 60 },
      { category: '健康生活', completed: 2, total: 3, progress: 67 },
      { category: '技能提升', completed: 1, total: 2, progress: 50 },
      { category: '工作职业', completed: 1, total: 1, progress: 100 }
    ],
    monthlyCompletion: [
      { month: '1月', completed: 2, created: 3 },
      { month: '2月', completed: 1, created: 2 },
      { month: '3月', completed: 3, created: 2 },
      { month: '4月', completed: 1, created: 1 }
    ]
  },
  healthMetrics: {
    weeklyStats: [
      { week: '第1周', exercise: 3, sleep: 7.2, nutrition: 75 },
      { week: '第2周', exercise: 4, sleep: 7.5, nutrition: 80 },
      { week: '第3周', exercise: 2, sleep: 6.8, nutrition: 70 },
      { week: '第4周', exercise: 5, sleep: 8.0, nutrition: 85 }
    ],
    trends: [
      { metric: '运动次数', current: 5, previous: 3, change: 67 },
      { metric: '睡眠质量', current: 8.0, previous: 7.2, change: 11 },
      { metric: '营养评分', current: 85, previous: 75, change: 13 }
    ]
  },
  insights: [
    {
      id: '1',
      type: 'success',
      title: '运动习惯显著改善',
      description: '本周运动频率比上周提升67%，坚持得很好！',
      recommendation: '建议保持当前运动强度，可以尝试增加运动种类的多样性。'
    },
    {
      id: '2',
      type: 'warning',
      title: '工作时间过长',
      description: '本周平均每日工作时间超过8小时，可能影响工作效率。',
      recommendation: '建议合理安排工作时间，适当休息以提高工作效率。'
    },
    {
      id: '3',
      type: 'info',
      title: '学习目标进展良好',
      description: '学习类目标完成率达到60%，保持稳定进步。',
      recommendation: '可以考虑设定更具挑战性的学习目标来加速成长。'
    }
  ]
}

const timeRangeOptions = [
  { value: '7d', label: '最近7天' },
  { value: '30d', label: '最近30天' },
  { value: '90d', label: '最近90天' },
  { value: '1y', label: '最近1年' }
]

export default function Reports() {
  const [reportData, setReportData] = useState<ReportData>(mockReportData)
  const [loading, setLoading] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)

  // 刷新数据
  const handleRefresh = async () => {
    setRefreshing(true)
    // 模拟API调用
    setTimeout(() => {
      setRefreshing(false)
      toast.success('数据已更新')
    }, 1000)
  }

  // 导出报告
  const handleExport = () => {
    toast.success('报告导出功能开发中')
  }

  // 获取洞察图标
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'warning':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'info':
        return <Lightbulb className="h-5 w-5 text-blue-600" />
      default:
        return <Brain className="h-5 w-5 text-gray-600" />
    }
  }

  // 获取洞察样式
  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据报告</h1>
          <p className="text-gray-600 mt-1">综合数据分析和AI洞察</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            刷新
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            导出报告
          </button>
        </div>
      </div>

      {/* 概览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">提醒总数</p>
              <p className="text-xl font-bold text-gray-900">{reportData.overview.totalReminders}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">完成计划</p>
              <p className="text-xl font-bold text-green-600">{reportData.overview.completedPlans}</p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">目标数量</p>
              <p className="text-xl font-bold text-purple-600">{reportData.overview.totalGoals}</p>
            </div>
            <Target className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">健康记录</p>
              <p className="text-xl font-bold text-red-600">{reportData.overview.healthRecords}</p>
            </div>
            <Heart className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">生产力</p>
              <p className="text-xl font-bold text-orange-600">{reportData.overview.averageProductivity}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">周增长</p>
              <p className="text-xl font-bold text-indigo-600">+{reportData.overview.weeklyGrowth}%</p>
            </div>
            <Brain className="h-8 w-8 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* 时间分析图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 每日时间分布 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">每日时间分布</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.timeAnalysis.dailyHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="work" stackId="a" fill="#3B82F6" name="工作" />
                <Bar dataKey="study" stackId="a" fill="#10B981" name="学习" />
                <Bar dataKey="rest" stackId="a" fill="#F59E0B" name="休息" />
                <Bar dataKey="exercise" stackId="a" fill="#EF4444" name="运动" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 时间分类占比 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">时间分类占比</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData.timeAnalysis.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {reportData.timeAnalysis.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 目标进度和健康趋势 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 目标完成趋势 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">目标完成趋势</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.goalProgress.monthlyCompletion}>
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

        {/* 健康指标雷达图 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">健康指标概览</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={reportData.healthMetrics.weeklyStats}>
                <PolarGrid />
                <PolarAngleAxis dataKey="week" />
                <PolarRadiusAxis angle={90} domain={[0, 10]} />
                <Radar name="运动" dataKey="exercise" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                <Radar name="睡眠" dataKey="sleep" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 目标分类进度 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">目标分类进度</h3>
        <div className="space-y-4">
          {reportData.goalProgress.categories.map((category, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{category.category}</span>
                  <span className="text-sm text-gray-600">
                    {category.completed}/{category.total} ({category.progress}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${category.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI洞察 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">AI智能洞察</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportData.insights.map((insight) => (
            <div key={insight.id} className={cn(
              "p-4 rounded-lg border-2",
              getInsightStyle(insight.type)
            )}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">{insight.title}</h4>
                  <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                  {insight.recommendation && (
                    <div className="bg-white bg-opacity-50 rounded p-2">
                      <p className="text-xs text-gray-600">
                        <strong>建议：</strong>{insight.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 健康趋势详情 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">健康趋势分析</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reportData.healthMetrics.trends.map((trend, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{trend.metric}</h4>
              <div className="text-2xl font-bold text-gray-900 mb-1">{trend.current}</div>
              <div className={cn(
                "text-sm font-medium",
                trend.change > 0 ? "text-green-600" : "text-red-600"
              )}>
                {trend.change > 0 ? '+' : ''}{trend.change}% vs 上周
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}