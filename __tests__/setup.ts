// 测试设置文件
import '@testing-library/jest-dom'

// 全局测试设置
beforeAll(() => {
  // 设置测试环境变量
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: true
  })
  process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test_db'
  process.env.NEXTAUTH_SECRET = 'test-secret'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
})

// 全局测试清理
afterAll(() => {
  // 清理测试环境
})

// 全局测试超时设置
jest.setTimeout(30000)

// 全局Mock设置
global.fetch = jest.fn()

// 清理所有Mock
afterEach(() => {
  jest.clearAllMocks()
})
