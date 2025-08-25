import express, { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../lib/supabase.js'

const router = express.Router()

// 用户注册
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: '邮箱、密码和姓名都是必填项'
      })
    }

    // 检查用户是否已存在
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '该邮箱已被注册'
      })
    }

    // 加密密码
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // 创建用户
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        plan_type: 'free'
      })
      .select('id, email, name, plan_type, created_at')
      .single()

    if (error) {
      console.error('创建用户失败:', error)
      return res.status(500).json({
        success: false,
        error: '创建用户失败'
      })
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      success: true,
      message: '注册成功',
      token,
      user: newUser
    })
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 用户登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '邮箱和密码都是必填项'
      })
    }

    // 查找用户
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, plan_type, password_hash, created_at')
      .eq('email', email)
      .single()

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: '邮箱或密码错误'
      })
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: '邮箱或密码错误'
      })
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // 返回用户信息（不包含密码）
    const { password_hash, ...userWithoutPassword } = user

    res.json({
      success: true,
      message: '登录成功',
      token,
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 验证token中间件
export const authenticateToken = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      success: false,
      error: '访问令牌缺失'
    })
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: '访问令牌无效'
      })
    }
    req.user = decoded
    next()
  })
}

// 获取当前用户信息
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, plan_type, preferences, created_at, updated_at')
      .eq('id', req.user.userId)
      .single()

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      })
    }

    res.json({
      success: true,
      user
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

export default router