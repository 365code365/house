const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertSalesPersonnel() {
  try {
    console.log('开始插入销售人员数据...');
    
    // 插入销售人员数据
    const salesPersonnel = [
      {
        employeeNo: 'SP001',
        name: '张小明',
        email: 'zhang@test.com',
        password: 'password123',
        phone: '0912345678',
        projectIds: '1'
      },
      {
        employeeNo: 'SP002',
        name: '李小华',
        email: 'li@test.com',
        password: 'password123',
        phone: '0912345679',
        projectIds: '1'
      },
      {
        employeeNo: 'SP003',
        name: '王小美',
        email: 'wang@test.com',
        password: 'password123',
        phone: '0912345680',
        projectIds: '1'
      },
      {
        employeeNo: 'SP004',
        name: '陈小强',
        email: 'chen@test.com',
        password: 'password123',
        phone: '0912345681',
        projectIds: '1'
      }
    ];

    for (const person of salesPersonnel) {
      try {
        await prisma.salesPersonnel.upsert({
          where: { employeeNo: person.employeeNo },
          update: {},
          create: person
        });
        console.log(`✓ 插入/更新销售人员: ${person.name} (${person.employeeNo})`);
      } catch (error) {
        console.log(`⚠ 销售人员 ${person.employeeNo} 可能已存在，跳过`);
      }
    }
    
    console.log('销售人员数据插入完成!');
  } catch (error) {
    console.error('插入销售人员数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertSalesPersonnel();