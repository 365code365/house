const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExistingAppointments() {
  try {
    console.log('检查现有预约记录...');
    
    const appointments = await prisma.customerAppointment.findMany({
      include: {
        salesPersonnel: true
      }
    });
    
    console.log('现有预约记录:');
    appointments.forEach((apt, index) => {
      console.log(`预约 ${index + 1}:`);
      console.log(`- ID: ${apt.id}`);
      console.log(`- salesId: '${apt.salesId}' (类型: ${typeof apt.salesId})`);
      console.log(`- 销售人员: ${apt.salesPersonnel ? apt.salesPersonnel.name : '未找到'}`);
      console.log(`- 客户姓名: ${apt.customerName}`);
      console.log('---');
    });
    
    // 尝试直接插入一条记录测试
    console.log('\n尝试直接插入测试记录...');
    try {
      const testAppointment = await prisma.customerAppointment.create({
        data: {
          projectId: 1,
          customerName: '测试客户',
          customerPhone: '0912345678',
          appointmentDate: new Date(),
          appointmentTime: '10:00',
          salesId: 'SP001',
          status: 'scheduled',
          source: 'online'
        }
      });
      console.log('✓ 测试记录插入成功:', testAppointment.id);
    } catch (insertError) {
      console.error('✗ 插入失败:', insertError.message);
      console.error('错误代码:', insertError.code);
    }
    
  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingAppointments();