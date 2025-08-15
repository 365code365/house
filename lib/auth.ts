import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

const prisma = new PrismaClient()

// 擴展NextAuth的Session和JWT類型
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      email: string
      name: string
      role: UserRole
      avatar: string | null
      phone: string | null
      department: string | null
      position: string | null
      projectIds: string | null
      isActive: boolean
    }
  }

  interface User {
    id: string
    username: string
    email: string
    name: string
    role: UserRole
    avatar: string | null
    phone: string | null
    department: string | null
    position: string | null
    projectIds: string | null
    isActive: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    role: UserRole
    avatar: string | null
    phone: string | null
    department: string | null
    position: string | null
    projectIds: string | null
    isActive: boolean
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: '用戶名', type: 'text' },
        password: { label: '密碼', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('請輸入用戶名和密碼')
        }

        try {
          // 查找用戶
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { username: credentials.username },
                { email: credentials.username }
              ]
            }
          })

          if (!user) {
            throw new Error('用戶不存在')
          }

          if (!user.isActive) {
            throw new Error('賬戶已被禁用')
          }

          // 驗證密碼
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          if (!isPasswordValid) {
            throw new Error('密碼錯誤')
          }

          // 更新最後登錄時間
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
          })

          return {
            id: user.id.toString(),
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            phone: user.phone,
            department: user.department,
            position: user.position,
            projectIds: user.projectIds,
            isActive: user.isActive
          }
        } catch (error) {
          console.error('認證錯誤:', error)
          throw error
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24小時
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24小時
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.avatar = user.avatar
        token.phone = user.phone
        token.department = user.department
        token.position = user.position
        token.projectIds = user.projectIds
        token.isActive = user.isActive
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.username = token.username
        session.user.role = token.role
        session.user.avatar = token.avatar
        session.user.phone = token.phone
        session.user.department = token.department
        session.user.position = token.position
        session.user.projectIds = token.projectIds
        session.user.isActive = token.isActive
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/auth/error'
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-here'
}

export default authOptions