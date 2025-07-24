import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import StyledComponentsRegistry from '@/lib/antd-registry'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '銷售管理系統',
  description: '房地產銷售管理系統 - 專業的建案銷控與客戶管理平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <StyledComponentsRegistry>
          <ConfigProvider
            locale={zhCN}
            theme={{
              token: {
                colorPrimary: '#1890ff',
                borderRadius: 6,
              },
            }}
          >
            <div className="min-h-screen">
              {children}
            </div>
          </ConfigProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}