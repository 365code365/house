const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PROJECT_ID = 1;

// 直接通过数据库插入数据（绕过API认证）
async function directDatabaseInsert() {
  console.log('🔄 直接通过数据库插入测试数据...\n');
  
  try {
    // 1. 检查并创建项目（如果不存在）
    console.log('🏗️ 检查项目...');
    let project = await prisma.project.findUnique({
      where: { id: PROJECT_ID }
    });
    
    if (!project) {
      console.log('📝 创建测试项目...');
      project = await prisma.project.create({
        data: {
          id: PROJECT_ID,
          name: '测试项目',
          description: '用于数据生成测试的项目',
          location: '测试地址',
          developer: '测试开发商',
          totalUnits: 1000,
          availableUnits: 800,
          startDate: new Date(),
          expectedEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('✅ 项目创建成功:', project.name);
    } else {
      console.log('✅ 项目已存在:', project.name);
    }
    
    // 2. 创建销售人员
    console.log('\n👨‍💼 创建销售人员...');
    const salesPeople = [
      {
        employeeNo: 'SP001',
        name: '张经理',
        email: 'zhang.manager@company.com',
        password: '$2a$10$dummy.hash.for.testing', // 虚拟密码hash
        phone: '13800138001',
        projectIds: PROJECT_ID.toString(),
        remark: '资深销售经理'
      },
      {
        employeeNo: 'SP002',
        name: '李顾问', 
        email: 'li.advisor@company.com',
        password: '$2a$10$dummy.hash.for.testing',
        phone: '13800138002',
        projectIds: PROJECT_ID.toString(),
        remark: '销售顾问'
      },
      {
        employeeNo: 'SP003',
        name: '王专员',
        email: 'wang.specialist@company.com',
        password: '$2a$10$dummy.hash.for.testing',
        phone: '13800138003',
        projectIds: PROJECT_ID.toString(),
        remark: '销售专员'
      }
    ];
    
    for (const person of salesPeople) {
      try {
        const created = await prisma.salesPersonnel.upsert({
          where: { employeeNo: person.employeeNo },
          update: person,
          create: person
        });
        console.log(`✅ 销售人员: ${created.name} (${created.employeeNo})`);
      } catch (error) {
        console.log(`❌ 创建销售人员失败 ${person.employeeNo}:`, error.message);
      }
    }
    
    // 3. 创建停车位
    console.log('\n🚗 创建停车位...');
    for (let i = 1; i <= 10; i++) {
      try {
        const parkingData = {
          projectId: PROJECT_ID,
          parkingNo: `B1-${i.toString().padStart(3, '0')}`,
          type: i <= 8 ? 'STANDARD' : 'LARGE',
          price: i <= 8 ? 150000 : 200000,
          salesStatus: Math.random() > 0.7 ? 'SOLD' : 'AVAILABLE',
          salesDate: Math.random() > 0.7 ? new Date() : null,
          buyer: Math.random() > 0.7 ? `停车位业主${i}` : null,
          remark: `地下一层停车位，编号B1-${i.toString().padStart(3, '0')}`
        };
        
        const created = await prisma.parkingSpace.upsert({
          where: { 
            projectId_parkingNo: { 
              projectId: PROJECT_ID, 
              parkingNo: parkingData.parkingNo 
            } 
          },
          update: parkingData,
          create: parkingData
        });
        console.log(`✅ 停车位: ${created.parkingNo}`);
      } catch (error) {
        console.log(`❌ 创建停车位失败 B1-${i.toString().padStart(3, '0')}:`, error.message);
      }
    }
    
    // 4. 创建销控数据
    console.log('\n🏢 创建销控数据...');
    const buildings = ['A栋', 'B栋'];
    const salesIds = ['SP001', 'SP002', 'SP003'];
    
    let unitCount = 0;
    for (const building of buildings) {
      for (let floor = 1; floor <= 3; floor++) {
        for (let unit = 1; unit <= 2; unit++) {
          unitCount++;
          try {
            const houseNo = `${building}${floor.toString().padStart(2, '0')}${unit.toString().padStart(2, '0')}`;
            const area = 100 + Math.random() * 50;
            const unitPrice = 20000 + Math.random() * 5000;
            const houseTotal = area * unitPrice;
            const salesStatus = Math.random() > 0.6 ? 'SOLD' : (Math.random() > 0.5 ? 'DEPOSIT' : 'AVAILABLE');
            const hasSales = salesStatus !== 'AVAILABLE';
            
            const salesControlData = {
              projectId: PROJECT_ID,
              building: building,
              floor: floor,
              houseNo: houseNo,
              unit: `${unit}室`,
              area: Math.round(area * 100) / 100,
              unitPrice: Math.round(unitPrice),
              houseTotal: Math.round(houseTotal),
              totalWithParking: Math.round(houseTotal + (Math.random() > 0.5 ? 150000 : 0)),
              basePrice: Math.round(unitPrice * 0.9),
              premiumRate: Math.round(Math.random() * 20) / 100,
              salesStatus: salesStatus,
              salesDate: hasSales ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) : null,
              depositDate: salesStatus === 'DEPOSIT' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
              signDate: salesStatus === 'SOLD' ? new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000) : null,
              buyer: hasSales ? `业主${unitCount}` : null,
              salesId: hasSales ? salesIds[Math.floor(Math.random() * salesIds.length)] : null,
              parkingIds: Math.random() > 0.7 ? Math.floor(Math.random() * 10 + 1).toString() : null,
              customChange: Math.random() > 0.8,
              customChangeContent: Math.random() > 0.8 ? '客户要求改动户型' : null,
              mediaSource: hasSales ? ['线上广告', '朋友介绍', '现场咨询'][Math.floor(Math.random() * 3)] : null,
              introducer: Math.random() > 0.8 ? `介绍人${unitCount}` : null,
              notes: Math.random() > 0.8 ? `备注信息${unitCount}` : null
            };
            
            const created = await prisma.salesControl.upsert({
              where: {
                projectId_houseNo: {
                  projectId: PROJECT_ID,
                  houseNo: houseNo
                }
              },
              update: salesControlData,
              create: salesControlData
            });
            console.log(`✅ 销控: ${created.houseNo} (${created.salesStatus})`);
          } catch (error) {
            console.log(`❌ 创建销控数据失败 ${building}${floor}${unit}:`, error.message);
          }
        }
      }
    }
    
    // 5. 创建预约数据
    console.log('\n📅 创建预约数据...');
    for (let i = 1; i <= 8; i++) {
      try {
        const startTime = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2小时后结束
        
        const appointmentData = {
          projectId: PROJECT_ID,
          customerName: `客户${i}`,
          phone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
          startTime: startTime,
          endTime: endTime,
          salesId: salesIds[Math.floor(Math.random() * salesIds.length)],
          status: ['PENDING', 'CONFIRMED'][Math.floor(Math.random() * 2)],
          remark: Math.random() > 0.7 ? `预约备注${i}` : null
        };
        
        const created = await prisma.customerAppointment.create({
          data: appointmentData
        });
        console.log(`✅ 预约: ${created.customerName} - ${created.status}`);
      } catch (error) {
        console.log(`❌ 创建预约失败 ${i}:`, error.message);
      }
    }
    
    // 6. 创建已购客户
    console.log('\n👥 创建已购客户...');
    for (let i = 1; i <= 10; i++) {
      try {
        const houseNo = `A栋${Math.floor(i / 3) + 1}层${((i - 1) % 2 + 1)}室`;
        const customerData = {
          projectId: PROJECT_ID,
          name: `已购客户${i}`,
          houseNo: houseNo,
          purchaseDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
          idCard: `${Math.floor(Math.random() * 900000) + 100000}19850101${Math.floor(Math.random() * 9000) + 1000}`,
          isCorporate: false,
          email: `customer${i}@email.com`,
          phone: `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
          age: Math.floor(Math.random() * 40) + 25,
          occupation: ['工程师', '医生', '教师'][Math.floor(Math.random() * 3)],
          registeredAddress: `注册地址${i}`,
          mailingAddress: `邮寄地址${i}`,
          remark: Math.random() > 0.7 ? `客户备注${i}` : null,
          rating: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
          salesId: salesIds[Math.floor(Math.random() * salesIds.length)]
        };
        
        const created = await prisma.purchasedCustomer.create({
          data: customerData
        });
        console.log(`✅ 已购客户: ${created.name} - ${created.houseNo}`);
      } catch (error) {
        console.log(`❌ 创建已购客户失败 ${i}:`, error.message);
      }
    }
    
    // 7. 创建退户记录
    console.log('\n↩️ 创建退户记录...');
    for (let i = 1; i <= 5; i++) {
      try {
        const withdrawalData = {
          projectId: PROJECT_ID,
          customerName: `退户客户${i}`,
          building: 'A栋',
          floor: i,
          unit: '1室',
          withdrawalDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
          housePrice: Math.round((300000 + Math.random() * 500000) / 1000) * 1000,
          unitPrice: 20000 + Math.random() * 5000,
          totalPrice: Math.round((300000 + Math.random() * 500000) / 1000) * 1000,
          houseNo: `A栋${i.toString().padStart(2, '0')}01`,
          reason: ['个人原因', '资金问题', '其他'][Math.floor(Math.random() * 3)],
          status: ['APPLIED', 'PROCESSING', 'COMPLETED'][Math.floor(Math.random() * 3)]
        };
        
        const created = await prisma.withdrawalRecord.create({
          data: withdrawalData
        });
        console.log(`✅ 退户记录: ${created.customerName} - ${created.building}${created.floor}${created.unit}`);
      } catch (error) {
        console.log(`❌ 创建退户记录失败 ${i}:`, error.message);
      }
    }
    
    // 8. 验证数据创建结果
    console.log('\n📊 验证创建结果...');
    const counts = {
      salesPersonnel: await prisma.salesPersonnel.count({ where: { projectIds: { contains: PROJECT_ID.toString() } } }),
      parkingSpaces: await prisma.parkingSpace.count({ where: { projectId: PROJECT_ID } }),
      salesControl: await prisma.salesControl.count({ where: { projectId: PROJECT_ID } }),
      appointments: await prisma.customerAppointment.count({ where: { projectId: PROJECT_ID } }),
      purchasedCustomers: await prisma.purchasedCustomer.count({ where: { projectId: PROJECT_ID } }),
      withdrawalRecords: await prisma.withdrawalRecord.count({ where: { projectId: PROJECT_ID } })
    };
    
    console.log('数据创建统计:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count}条`);
    });
    
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    console.log(`   总计: ${total}条记录`);
    
    if (total > 0) {
      console.log('\n🎉 数据直接插入成功！现在数据库中有数据了。');
      console.log('💡 这证明问题在于API认证，而不是数据库连接。');
    } else {
      console.log('\n❌ 即使直接插入也失败了，可能是数据库配置问题。');
    }
    
  } catch (error) {
    console.error('❌ 直接插入数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 清理直接插入的数据
async function clearDirectData() {
  console.log('🧹 清理直接插入的数据...');
  
  try {
          const results = await Promise.all([
        prisma.withdrawalRecord.deleteMany({ where: { projectId: PROJECT_ID } }),
        prisma.purchasedCustomer.deleteMany({ where: { projectId: PROJECT_ID } }),
        prisma.customerAppointment.deleteMany({ where: { projectId: PROJECT_ID } }),
        prisma.salesControl.deleteMany({ where: { projectId: PROJECT_ID } }),
        prisma.parkingSpace.deleteMany({ where: { projectId: PROJECT_ID } }),
        prisma.salesPersonnel.deleteMany({ where: { projectIds: { contains: PROJECT_ID.toString() } } })
      ]);
    
    const totalDeleted = results.reduce((sum, result) => sum + result.count, 0);
    console.log(`✅ 清理完成，删除了 ${totalDeleted} 条记录`);
    
  } catch (error) {
    console.error('❌ 清理数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
if (args.includes('--clear')) {
  clearDirectData();
} else if (args.includes('--help')) {
  console.log(`
📋 直接数据库插入脚本

用法:
  node scripts/direct-database-insert.js [选项]

选项:
  --help     显示帮助信息
  --clear    清理直接插入的数据
  (无参数)   直接向数据库插入测试数据

说明:
  这个脚本绕过API直接向数据库插入数据，用于测试数据库连接
  和排除API认证问题。如果这个脚本成功插入数据，说明问题
  在于API认证而不是数据库。
  `);
} else {
  directDatabaseInsert();
}

module.exports = {
  directDatabaseInsert,
  clearDirectData
};
