import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface Record {
  id: string
  content: string
  type: 'text' | 'voice' | 'image'
  tags: string[]
  created_at: string
  updated_at: string
}

interface RecordsContextType {
  records: Record[]
  isLoading: boolean
  refreshRecords: () => Promise<void>
  addRecord: (record: Record) => void
  updateRecord: (id: string, updates: Partial<Record>) => void
  deleteRecord: (id: string) => void
  createRecord: (recordData: Omit<Record, 'id' | 'created_at' | 'updated_at'>) => Promise<Record | null>
}

const RecordsContext = createContext<RecordsContextType | undefined>(undefined)

export const useRecords = () => {
  const context = useContext(RecordsContext)
  if (context === undefined) {
    throw new Error('useRecords must be used within a RecordsProvider')
  }
  return context
}

interface RecordsProviderProps {
  children: ReactNode
}

export const RecordsProvider: React.FC<RecordsProviderProps> = ({ children }) => {
  const { token } = useAuth()
  const [records, setRecords] = useState<Record[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 刷新记录数据
  const refreshRecords = useCallback(async () => {
    if (!token) return
    
    try {
      setIsLoading(true)
      const response = await fetch('/api/records', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setRecords(data.records || [])
        }
      }
    } catch (error) {
      console.error('获取记录失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  // 添加新记录到本地状态
  const addRecord = useCallback((record: Record) => {
    setRecords(prev => [record, ...prev])
  }, [])

  // 更新记录
  const updateRecord = useCallback((id: string, updates: Partial<Record>) => {
    setRecords(prev => prev.map(record => 
      record.id === id ? { ...record, ...updates } : record
    ))
  }, [])

  // 删除记录
  const deleteRecord = useCallback((id: string) => {
    setRecords(prev => prev.filter(record => record.id !== id))
  }, [])

  // 创建新记录（API调用 + 本地状态更新）
  const createRecord = useCallback(async (recordData: Omit<Record, 'id' | 'created_at' | 'updated_at'>): Promise<Record | null> => {
    if (!token) return null

    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(recordData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.record) {
          // 添加到本地状态
          addRecord(data.record)
          return data.record
        }
      }
    } catch (error) {
      console.error('创建记录失败:', error)
    }
    
    return null
  }, [token, addRecord])

  const value: RecordsContextType = {
    records,
    isLoading,
    refreshRecords,
    addRecord,
    updateRecord,
    deleteRecord,
    createRecord
  }

  return (
    <RecordsContext.Provider value={value}>
      {children}
    </RecordsContext.Provider>
  )
}