/** @type {import('next').NextConfig} */
const nextConfig = {
  // 環境變量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // 公開環境變量（自動以 NEXT_PUBLIC_ 開頭的變量會被公開）
  publicRuntimeConfig: {
    appName: process.env.NEXT_PUBLIC_APP_NAME,
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
  },
  
  // 服務端環境變量
  serverRuntimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    smtpHost: process.env.SMTP_HOST,
  },
  
  // 圖片配置
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // 圖片大小限制
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // 編譯配置
  compiler: {
    // 移除 console.log（僅在生產環境）
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 實驗性功能
  experimental: {
    // 啟用 App Router（如果使用）
    appDir: true,
  },
  
  // 重定向配置
  async redirects() {
    return [
      {
        source: '/',
        destination: '/project/1',
        permanent: false,
      },
    ]
  },
  
  // Headers 配置
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.CORS_ORIGIN || '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig