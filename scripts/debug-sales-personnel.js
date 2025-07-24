const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugSalesPersonnel() {
  try {
    console.log('检查sales_personnel表结构和数据...');
    
    // 查询所有sales_personnel记录
    const allSalesPersonnel = await prisma.salesPersonnel.findMany();
    console.log('所有sales_personnel记录:');
    allSalesPersonnel.forEach(sp => {
      console.log(`- employeeNo: '${sp.employeeNo}' (类型: ${typeof sp.employeeNo})`);
      console.log(`  name: '${sp.name}'`);
      console.log(`  phone: '${sp.phone}'`);
      console.log('---');
    });
    
    // 特别检查SP001
    const sp001 = await prisma.salesPersonnel.findUnique({
      where: { employeeNo: 'SP001' }
    });
    console.log('\nSP001查询结果:', sp001);
    
    // 检查是否有空格或特殊字符
    if (sp001) {
      console.log('SP001 employeeNo 十六进制:', Buffer.from(sp001.employeeNo).toString('hex'));
      console.log('SP001 employeeNo 长度:', sp001.employeeNo.length);
    }
    
    // 尝试查询customer_appointment表
    const appointments = await prisma.customerAppointment.findMany({
      take: 5
    });
    console.log('\n现有预约记录数量:', appointments.length);
    
  } catch (error) {
    console.error('调试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSalesPersonnel();