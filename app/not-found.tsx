'use client'

import { useRouter } from 'next/navigation'
import { Button, Typography, Space } from 'antd'
import { 
  HomeOutlined, 
  ArrowLeftOutlined, 
  ExclamationCircleOutlined 
} from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function NotFound() {
  const router = useRouter()

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center p-8 max-w-md mx-auto">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="relative inline-block">
            <div className="text-8xl font-bold text-blue-200 select-none">
              404
            </div>
            <ExclamationCircleOutlined 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl text-blue-400"
            />
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <Title level={2} className="text-gray-800 mb-4">
            頁面不存在
          </Title>
          <Paragraph className="text-gray-600 text-lg leading-relaxed">
            抱歉，您訪問的頁面不存在或已被移除。
            <br />
            請檢查網址是否正確，或返回上一頁繼續瀏覽。
          </Paragraph>
        </div>

        {/* Action Buttons */}
        <Space size="large" direction="vertical" className="w-full">
          <Button 
            type="primary" 
            size="large" 
            icon={<ArrowLeftOutlined />}
            onClick={handleGoBack}
            className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300"
          >
            返回上一頁
          </Button>
          
          <Button 
            size="large" 
            icon={<HomeOutlined />}
            onClick={handleGoHome}
            className="w-full h-12 text-base font-medium border-blue-300 text-blue-600 hover:border-blue-500 hover:text-blue-700 transition-all duration-300"
          >
            回到首頁
          </Button>
        </Space>

        {/* Decorative Elements */}
        <div className="mt-12 opacity-30">
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    </div>
  )
}