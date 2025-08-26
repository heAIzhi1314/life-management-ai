import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Save, X, Download, Upload, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface KeywordConfig {
  id: string
  category: 'record' | 'reminder' | 'plan' | 'health' | 'growth'
  keywords: string[]
  priority: number
}

interface EditingKeyword {
  id: string
  category: 'record' | 'reminder' | 'plan' | 'health' | 'growth'
  keywords: string
}

const DEFAULT_KEYWORDS: KeywordConfig[] = [
  { id: '1', category: 'record', keywords: ['记录', '记下', '保存', '备忘'], priority: 1 },
  { id: '2', category: 'reminder', keywords: ['提醒', '提醒我', '别忘了', '记得'], priority: 1 },
  { id: '3', category: 'plan', keywords: ['计划', '安排', '规划', '打算'], priority: 1 },
  { id: '4', category: 'health', keywords: ['健康', '体重', '血压', '运动'], priority: 1 },
  { id: '5', category: 'growth', keywords: ['成长', '学习', '进步', '目标'], priority: 1 }
]

const CATEGORY_LABELS = {
  record: '记录',
  reminder: '提醒',
  plan: '计划',
  health: '健康',
  growth: '成长'
}

const CATEGORY_COLORS = {
  record: 'bg-blue-50 text-blue-700 border-blue-200',
  reminder: 'bg-green-50 text-green-700 border-green-200',
  plan: 'bg-purple-50 text-purple-700 border-purple-200',
  health: 'bg-red-50 text-red-700 border-red-200',
  growth: 'bg-yellow-50 text-yellow-700 border-yellow-200'
}

export default function Settings() {
  const [keywordConfigs, setKeywordConfigs] = useState<KeywordConfig[]>(DEFAULT_KEYWORDS)
  const [editingKeyword, setEditingKeyword] = useState<EditingKeyword | null>(null)
  const [newKeyword, setNewKeyword] = useState<EditingKeyword>({ id: '', category: 'record', keywords: '' })
  const [showAddForm, setShowAddForm] = useState(false)
  const [conflicts, setConflicts] = useState<string[]>([])

  // 加载用户自定义关键词
  const loadKeywords = useCallback(async () => {
    try {
      const response = await fetch('/api/keywords')
      if (response.ok) {
        const data = await response.json()
        setKeywordConfigs(data)
        detectConflicts(data)
      } else {
        console.error('Failed to load keywords from server')
        // 回退到localStorage
        const savedKeywords = localStorage.getItem('customKeywords')
        if (savedKeywords) {
          const parsed = JSON.parse(savedKeywords)
          setKeywordConfigs(parsed)
          detectConflicts(parsed)
        }
      }
    } catch (error) {
      console.error('Error loading keywords:', error)
      // 回退到localStorage
      const savedKeywords = localStorage.getItem('customKeywords')
      if (savedKeywords) {
        try {
          const parsed = JSON.parse(savedKeywords)
          setKeywordConfigs(parsed)
          detectConflicts(parsed)
        } catch (parseError) {
          console.error('Failed to parse saved keywords:', parseError)
        }
      }
    }
  }, [])

  useEffect(() => {
    loadKeywords()
  }, [loadKeywords])

  // 保存关键词配置到localStorage（作为备份）
  const saveKeywordsToLocal = (configs: KeywordConfig[]) => {
    localStorage.setItem('customKeywords', JSON.stringify(configs))
  }

  // 检测关键词冲突
  const detectConflicts = (configs: KeywordConfig[]) => {
    const allKeywords: string[] = []
    const conflictList: string[] = []
    
    configs.forEach(config => {
      config.keywords.forEach(keyword => {
        if (allKeywords.includes(keyword)) {
          if (!conflictList.includes(keyword)) {
            conflictList.push(keyword)
          }
        } else {
          allKeywords.push(keyword)
        }
      })
    })
    
    setConflicts(conflictList)
    return conflictList.length === 0
  }

  // 添加新关键词配置
  const handleAddKeyword = async () => {
    if (!newKeyword.keywords.trim()) {
      toast.error('请输入关键词')
      return
    }

    const keywords = newKeyword.keywords.split(',').map(k => k.trim()).filter(k => k)
    
    try {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: newKeyword.category,
          keywords,
          priority: 2
        })
      })

      if (response.ok) {
        const newConfig = await response.json()
        const updatedConfigs = [...keywordConfigs, newConfig]
        setKeywordConfigs(updatedConfigs)
        saveKeywordsToLocal(updatedConfigs)
        detectConflicts(updatedConfigs)
        setNewKeyword({ id: '', category: 'record', keywords: '' })
        setShowAddForm(false)
        toast.success('关键词配置已保存')
      } else {
        const errorData = await response.json()
        if (errorData.conflicts) {
          toast.error(`存在关键词冲突：${errorData.conflicts.join(', ')}`)
        } else {
          toast.error(errorData.error || '保存失败')
        }
      }
    } catch (error) {
      console.error('Error adding keyword:', error)
      toast.error('网络错误，请重试')
    }
  }

  // 编辑关键词配置
  const handleEditKeyword = (config: KeywordConfig) => {
    setEditingKeyword({
      id: config.id,
      category: config.category,
      keywords: config.keywords.join(', ')
    })
  }

  // 保存编辑的关键词
  const handleSaveEdit = async () => {
    if (!editingKeyword || !editingKeyword.keywords.trim()) {
      toast.error('请输入关键词')
      return
    }

    const keywords = editingKeyword.keywords.split(',').map(k => k.trim()).filter(k => k)
    
    try {
      const response = await fetch(`/api/keywords/${editingKeyword.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: editingKeyword.category,
          keywords,
          priority: keywordConfigs.find(c => c.id === editingKeyword.id)?.priority || 2
        })
      })

      if (response.ok) {
        const updatedConfig = await response.json()
        const updatedConfigs = keywordConfigs.map(config => 
          config.id === editingKeyword.id ? updatedConfig : config
        )
        setKeywordConfigs(updatedConfigs)
        saveKeywordsToLocal(updatedConfigs)
        detectConflicts(updatedConfigs)
        setEditingKeyword(null)
        toast.success('关键词配置已更新')
      } else {
        const errorData = await response.json()
        if (errorData.conflicts) {
          toast.error(`存在关键词冲突：${errorData.conflicts.join(', ')}`)
        } else {
          toast.error(errorData.error || '更新失败')
        }
      }
    } catch (error) {
      console.error('Error updating keyword:', error)
      toast.error('网络错误，请重试')
    }
  }

  // 删除关键词配置
  const handleDeleteKeyword = async (id: string) => {
    try {
      const response = await fetch(`/api/keywords/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const updatedConfigs = keywordConfigs.filter(config => config.id !== id)
        setKeywordConfigs(updatedConfigs)
        saveKeywordsToLocal(updatedConfigs)
        detectConflicts(updatedConfigs)
        toast.success('关键词配置已删除')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || '删除失败')
      }
    } catch (error) {
      console.error('Error deleting keyword:', error)
      toast.error('网络错误，请重试')
    }
  }

  // 导出配置
  const handleExport = () => {
    const dataStr = JSON.stringify(keywordConfigs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'keyword-config.json'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('配置已导出')
  }

  // 导入配置
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        if (Array.isArray(imported) && imported.every(item => 
          item.category && Array.isArray(item.keywords)
        )) {
          try {
            const response = await fetch('/api/keywords/import', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ configs: imported })
            })

            if (response.ok) {
              const result = await response.json()
              setKeywordConfigs(result.data)
              saveKeywordsToLocal(result.data)
              detectConflicts(result.data)
              toast.success('配置导入成功')
            } else {
              const errorData = await response.json()
              if (errorData.duplicates) {
                toast.error(`导入的配置存在重复关键词：${errorData.duplicates.join(', ')}`)
              } else {
                toast.error(errorData.error || '导入失败')
              }
            }
          } catch (error) {
            console.error('Error importing keywords:', error)
            toast.error('网络错误，请重试')
          }
        } else {
          toast.error('配置文件格式不正确')
        }
      } catch (parseError) {
        console.error('Failed to parse config file:', parseError)
        toast.error('配置文件解析失败')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  // 重置为默认配置
  const handleReset = async () => {
    if (confirm('确定要重置为默认配置吗？这将删除所有自定义关键词。')) {
      try {
        const response = await fetch('/api/keywords/reset', {
          method: 'POST'
        })

        if (response.ok) {
          const result = await response.json()
          setKeywordConfigs(result.data)
          saveKeywordsToLocal(result.data)
          detectConflicts(result.data)
          toast.success('已重置为默认配置')
        } else {
          const errorData = await response.json()
          toast.error(errorData.error || '重置失败')
        }
      } catch (error) {
        console.error('Error resetting keywords:', error)
        toast.error('网络错误，请重试')
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">设置</h1>
        <p className="text-gray-600 mt-1">管理您的个人信息和系统配置</p>
      </div>

      {/* 关键词管理 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI关键词配置</h2>
              <p className="text-sm text-gray-600 mt-1">
                配置AI助手识别的关键词，让AI更准确地理解您的意图
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                添加关键词
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-1" />
                导出
              </button>
              <label className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                <Upload className="w-4 h-4 mr-1" />
                导入
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleReset}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                重置
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* 冲突警告 */}
          {conflicts.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <h3 className="text-sm font-medium text-red-800">关键词冲突</h3>
              </div>
              <p className="text-sm text-red-700 mt-1">
                以下关键词在多个类别中重复：{conflicts.join(', ')}
              </p>
            </div>
          )}

          {/* 添加新关键词表单 */}
          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">添加新关键词配置</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">类别</label>
                  <select
                    value={newKeyword.category}
                    onChange={(e) => setNewKeyword({ ...newKeyword, category: e.target.value as KeywordConfig['category'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    关键词（用逗号分隔）
                  </label>
                  <input
                    type="text"
                    value={newKeyword.keywords}
                    onChange={(e) => setNewKeyword({ ...newKeyword, keywords: e.target.value })}
                    placeholder="例如：记录,记下,保存"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 mt-4">
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewKeyword({ id: '', category: 'record', keywords: '' })
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  取消
                </button>
                <button
                  onClick={handleAddKeyword}
                  className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-1" />
                  保存
                </button>
              </div>
            </div>
          )}

          {/* 关键词配置列表 */}
          <div className="space-y-4">
            {keywordConfigs.map((config) => (
              <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                {editingKeyword?.id === config.id ? (
                  // 编辑模式
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">类别</label>
                        <select
                          value={editingKeyword.category}
                          onChange={(e) => setEditingKeyword({ ...editingKeyword, category: e.target.value as KeywordConfig['category'] })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          关键词（用逗号分隔）
                        </label>
                        <input
                          type="text"
                          value={editingKeyword.keywords}
                          onChange={(e) => setEditingKeyword({ ...editingKeyword, keywords: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setEditingKeyword(null)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        取消
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        保存
                      </button>
                    </div>
                  </div>
                ) : (
                  // 显示模式
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${CATEGORY_COLORS[config.category]}`}>
                        {CATEGORY_LABELS[config.category]}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {config.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded ${
                              conflicts.includes(keyword) ? 'bg-red-100 text-red-700' : ''
                            }`}
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                      {config.priority > 1 && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          自定义
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditKeyword(config)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteKeyword(config.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {keywordConfigs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>暂无关键词配置</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-2 text-blue-600 hover:text-blue-700"
              >
                添加第一个关键词配置
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">使用说明</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 自定义关键词优先级高于默认关键词</li>
          <li>• 关键词不区分大小写，支持模糊匹配</li>
          <li>• 避免在不同类别中使用相同的关键词</li>
          <li>• 可以导出配置文件进行备份或分享</li>
        </ul>
      </div>
    </div>
  )
}