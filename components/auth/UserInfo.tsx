'use client'

import { useSession } from 'next-auth/react'
import { Avatar, Dropdown, Space, Typography, Tag, Spin } from 'antd'
import { UserOutlined, DownOutlined } from '@ant-design/icons'
import { UserRole } from '@prisma/client'
import LogoutButton from './LogoutButton'

const { Text } = Typography

// 角色顯示配置
const roleConfig = {
  [UserRole.SUPER_ADMIN]: { label: '超級管理員', color: 'red' },
  [UserRole.ADMIN]: { label: '管理員', color: 'orange' },
  [UserRole.SALES_MANAGER]: { label: '銷售經理', color: 'blue' },
  [UserRole.SALES_PERSON]: { label: '銷售人員', color: 'green' },
  [UserRole.CUSTOMER_SERVICE]: { label: '客服人員', color: 'cyan' },
  [UserRole.FINANCE]: { label: '財務人員', color: 'purple' },
  [UserRole.USER]: { label: '用戶', color: 'default' }
}

interface UserInfoProps {
  showDropdown?: boolean
  showRole?: boolean
  className?: string
}

export default function UserInfo({ 
  showDropdown = true, 
  showRole = true,
  className = '' 
}: UserInfoProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className={`flex items-center ${className}`}>
        <Spin size="small" />
        <Text className="ml-2">載入中...</Text>
      </div>
    )
  }

  if (status === 'unauthenticated' || !session?.user) {
    return (
      <div className={`flex items-center ${className}`}>
        <Text type="secondary">未登錄</Text>
      </div>
    )
  }

  const user = session.user
  const roleInfo = roleConfig[user.role as UserRole] || { label: '未知角色', color: 'default' }

  const userContent = (
    <Space>
      <Avatar 
        src={user.avatar} 
        icon={<UserOutlined />}
        size="small"
      />
      <div className="flex flex-col">
        <Text strong className="text-sm">
          {user.name || user.username}
        </Text>
        {showRole && (
          <Tag color={roleInfo.color} className="text-xs">
            {roleInfo.label}
          </Tag>
        )}
      </div>
    </Space>
  )

  if (!showDropdown) {
    return (
      <div className={`flex items-center ${className}`}>
        {userContent}
      </div>
    )
  }

  const dropdownItems = [
    {
      key: 'profile',
      label: (
        <div className="px-2 py-1">
          <div className="font-medium">{user.name || user.username}</div>
          <div className="text-xs text-gray-500">{user.email}</div>
          {user.phone && (
            <div className="text-xs text-gray-500">{user.phone}</div>
          )}
          <Tag color={roleInfo.color} className="mt-1">
            {roleInfo.label}
          </Tag>
        </div>
      ),
      disabled: true
    },
    {
      type: 'divider' as const
    },
    {
      key: 'logout',
      label: (
        <LogoutButton 
          type="text" 
          size="small" 
          className="border-0 shadow-none p-0 h-auto"
          showConfirm={false}
        >
          登出
        </LogoutButton>
      )
    }
  ]

  return (
    <div className={className}>
      <Dropdown 
        menu={{ items: dropdownItems }}
        trigger={['click']}
        placement="bottomRight"
      >
        <div className="flex items-center cursor-pointer hover:bg-gray-50 rounded px-2 py-1 transition-colors">
          {userContent}
          <DownOutlined className="ml-2 text-xs text-gray-400" />
        </div>
      </Dropdown>
    </div>
  )
}