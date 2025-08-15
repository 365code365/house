const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    // 检查是否已存在测试用户
    const existingUser = await prisma.salesPersonnel.findUnique({
      where: { email: 'test@example.com' }
    })

    if (existingUser) {
      console.log('测试用户已存在，跳过创建')
      return
    }

    // 创建测试用户
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const user = await prisma.salesPersonnel.create({
      data: {
        employee_no: 'TEST001',
        name: '測試用戶',
        email: 'test@example.com',
        password: hashedPassword,
        phone: '0912-345-678',
        project_ids: '1', // 可以访问项目ID为1的项目
        remark: '测试用户，用于系统测试'
      }
    })

    console.log('测试用户创建成功:', {
      id: user.id,
      email: user.email,
      name: user.name,
      employee_no: user.employee_no
    })

    console.log('\n登录信息:')
    console.log('邮箱: test@example.com')
    console.log('密码: password123')

  } catch (error) {
    console.error('创建测试用户失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
