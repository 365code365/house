'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button, Form, Input, Card, Typography, Alert, Space } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons'
import { App } from 'antd'

const { Title, Text } = Typography

interface LoginFormData {
  username: string
  password: string
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const handleLogin = async (values: LoginFormData) => {
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        username: values.username,
        password: values.password,
        redirect: false
      })

      if (result?.error) {
        setError('用戶名或密碼錯誤')
        message.error('登錄失敗，請檢查用戶名和密碼')
      } else if (result?.ok) {
        message.success('登錄成功')
        
        // 獲取用戶會話信息
        const session = await getSession()
        
        // 根據用戶角色重定向到相應頁面
        if (session?.user) {
          // 如果用戶有項目權限，重定向到第一個項目
          if (session.user.projectIds && session.user.projectIds !== '') {
            const projectIds = session.user.projectIds.split(',')
            const firstProjectId = projectIds[0] === '*' ? '1' : projectIds[0]
            router.push(`/project/${firstProjectId}/sales-control`)
          } else {
            // 沒有項目權限，重定向到用戶管理頁面
            router.push('/admin/users')
          }
        } else {
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('登錄錯誤:', error)
      setError('登錄過程中發生錯誤，請稍後重試')
      message.error('登錄失敗，請稍後重試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card 
        className="w-full max-w-md shadow-xl"
        bodyStyle={{ padding: '2rem' }}
      >
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <LoginOutlined className="text-white text-2xl" />
            </div>
          </div>
          <Title level={2} className="mb-2 text-gray-800">
            房地產銷控系統
          </Title>
          <Text type="secondary">
            請登錄您的賬戶以繼續
          </Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            className="mb-6"
            closable
            onClose={() => setError('')}
          />
        )}

        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          layout="vertical"
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="username"
            label="用戶名"
            rules={[
              { required: true, message: '請輸入用戶名' },
              { min: 3, message: '用戶名至少3個字符' }
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="請輸入用戶名"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密碼"
            rules={[
              { required: true, message: '請輸入密碼' },
              { min: 6, message: '密碼至少6個字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="請輸入密碼"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-12 text-lg font-medium"
              icon={<LoginOutlined />}
            >
              {loading ? '登錄中...' : '登錄'}
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-6 text-center">
          <Space direction="vertical" size="small">
            <Text type="secondary" className="text-sm">
              忘記密碼？請聯繫系統管理員
            </Text>
            <Text type="secondary" className="text-xs">
              © 2024 房地產銷控管理系統
            </Text>
          </Space>
        </div>
      </Card>
    </div>
  )
}