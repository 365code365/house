'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Button, Modal } from 'antd'
import { LogoutOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { App } from 'antd'

interface LogoutButtonProps {
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text'
  size?: 'large' | 'middle' | 'small'
  className?: string
  children?: React.ReactNode
  showConfirm?: boolean
}

export default function LogoutButton({
  type = 'default',
  size = 'middle',
  className = '',
  children,
  showConfirm = true
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const { message } = App.useApp()

  const handleLogout = async () => {
    setLoading(true)
    
    try {
      await signOut({
        callbackUrl: '/login',
        redirect: true
      })
      message.success('已安全登出')
    } catch (error) {
      console.error('登出錯誤:', error)
      message.error('登出失敗，請稍後重試')
    } finally {
      setLoading(false)
    }
  }

  const showLogoutConfirm = () => {
    Modal.confirm({
      title: '確認登出',
      icon: <ExclamationCircleOutlined />,
      content: '您確定要登出系統嗎？',
      okText: '確認登出',
      cancelText: '取消',
      okType: 'danger',
      onOk: handleLogout,
      centered: true
    })
  }

  const onClick = showConfirm ? showLogoutConfirm : handleLogout

  return (
    <Button
      type={type}
      size={size}
      className={className}
      icon={<LogoutOutlined />}
      loading={loading}
      onClick={onClick}
      danger={type === 'primary'}
    >
      {children || '登出'}
    </Button>
  )
}