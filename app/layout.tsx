import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ConfigProvider, App } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import StyledComponentsRegistry from '@/lib/antd-registry'
import QueryProvider from '@/components/providers/QueryProvider'
import SessionProvider from '@/components/auth/SessionProvider'
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
          <SessionProvider>
            <QueryProvider>
              <ConfigProvider
                locale={zhCN}
                theme={{
                  token: {
                    colorPrimary: '#1890ff',
                    borderRadius: 6,
                  },
                }}
              >
                <App>
                  <div className="min-h-screen">
                    {children}
                  </div>
                </App>
              </ConfigProvider>
            </QueryProvider>
          </SessionProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}