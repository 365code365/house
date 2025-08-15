import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedUsers() {
  console.log('開始創建測試用戶...')

  try {
    // 創建超級管理員
    const superAdminPassword = await bcrypt.hash('admin123', 12)
    const superAdmin = await prisma.user.upsert({
      where: { username: 'superadmin' },
      update: {},
      create: {
        username: 'superadmin',
        password: superAdminPassword,
        name: '超級管理員',
        email: 'superadmin@example.com',
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        projectIds: '*' // 所有項目權限
      }
    })
    console.log('✅ 創建超級管理員:', superAdmin.username)

    // 創建管理員
    const adminPassword = await bcrypt.hash('admin123', 12)
    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: adminPassword,
        name: '系統管理員',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        isActive: true,
        projectIds: '*' // 所有項目權限
      }
    })
    console.log('✅ 創建管理員:', admin.username)

    // 創建銷售經理
    const salesManagerPassword = await bcrypt.hash('sales123', 12)
    const salesManager = await prisma.user.upsert({
      where: { username: 'salesmanager' },
      update: {},
      create: {
        username: 'salesmanager',
        password: salesManagerPassword,
        name: '銷售經理',
        email: 'salesmanager@example.com',
        phone: '0912345678',
        role: UserRole.SALES_MANAGER,
        isActive: true,
        projectIds: '1,2' // 項目1和2的權限
      }
    })
    console.log('✅ 創建銷售經理:', salesManager.username)

    // 創建銷售人員
    const salesPersonPassword = await bcrypt.hash('sales123', 12)
    const salesPerson = await prisma.user.upsert({
      where: { username: 'salesperson' },
      update: {},
      create: {
        username: 'salesperson',
        password: salesPersonPassword,
        name: '銷售人員',
        email: 'salesperson@example.com',
        phone: '0987654321',
        role: UserRole.SALES_PERSON,
        isActive: true,
        projectIds: '1' // 僅項目1的權限
      }
    })
    console.log('✅ 創建銷售人員:', salesPerson.username)

    // 創建客服人員
    const customerServicePassword = await bcrypt.hash('service123', 12)
    const customerService = await prisma.user.upsert({
      where: { username: 'customerservice' },
      update: {},
      create: {
        username: 'customerservice',
        password: customerServicePassword,
        name: '客服人員',
        email: 'customerservice@example.com',
        phone: '0911111111',
        role: UserRole.CUSTOMER_SERVICE,
        isActive: true,
        projectIds: '1,2' // 項目1和2的權限
      }
    })
    console.log('✅ 創建客服人員:', customerService.username)

    // 創建財務人員
    const financePassword = await bcrypt.hash('finance123', 12)
    const finance = await prisma.user.upsert({
      where: { username: 'finance' },
      update: {},
      create: {
        username: 'finance',
        password: financePassword,
        name: '財務人員',
        email: 'finance@example.com',
        phone: '0922222222',
        role: UserRole.FINANCE,
        isActive: true,
        projectIds: '*' // 所有項目權限
      }
    })
    console.log('✅ 創建財務人員:', finance.username)

    // 創建普通用戶
    const userPassword = await bcrypt.hash('user123', 12)
    const user = await prisma.user.upsert({
      where: { username: 'user' },
      update: {},
      create: {
        username: 'user',
        password: userPassword,
        name: '普通用戶',
        email: 'user@example.com',
        role: UserRole.USER,
        isActive: true,
        projectIds: '1' // 僅項目1的權限
      }
    })
    console.log('✅ 創建普通用戶:', user.username)

    console.log('\n🎉 測試用戶創建完成！')
    console.log('\n📋 測試賬戶信息:')
    console.log('超級管理員: superadmin / admin123')
    console.log('管理員: admin / admin123')
    console.log('銷售經理: salesmanager / sales123')
    console.log('銷售人員: salesperson / sales123')
    console.log('客服人員: customerservice / service123')
    console.log('財務人員: finance / finance123')
    console.log('普通用戶: user / user123')

  } catch (error) {
    console.error('❌ 創建測試用戶失敗:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedUsers()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })