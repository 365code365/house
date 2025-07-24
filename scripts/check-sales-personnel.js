const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSalesPersonnel() {
  try {
    console.log('检查sales_personnel表数据...');
    
    const salesPersonnel = await prisma.salesPersonnel.findMany();
    
    console.log('找到的销售人员数据:');
    salesPersonnel.forEach(person => {
      console.log(`- employee_no: ${person.employeeNo}, name: ${person.name}`);
    });
    
    console.log(`\n总共 ${salesPersonnel.length} 条记录`);
    
    // 特别检查SP001是否存在
    const sp001 = await prisma.salesPersonnel.findUnique({
      where: { employeeNo: 'SP001' }
    });
    
    if (sp001) {
      console.log('\n✓ SP001 存在于数据库中');
    } else {
      console.log('\n✗ SP001 不存在于数据库中');
    }
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSalesPersonnel();