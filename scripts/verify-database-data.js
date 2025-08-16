const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PROJECT_ID = 1;

async function verifyDatabaseData() {
  console.log('🔍 验证数据库中的数据...\n');
  
  try {
    // 1. 检查销售人员数据
    console.log('👨‍💼 检查销售人员数据:');
    const salesPersonnel = await prisma.salesPersonnel.findMany({
      where: {
        projectIds: { contains: PROJECT_ID.toString() }
      }
    });
    console.log(`   📊 销售人员总数: ${salesPersonnel.length}`);
    salesPersonnel.forEach(person => {
      console.log(`   ✅ ${person.employeeNo} - ${person.name} (${person.email})`);
    });
    
    // 2. 检查停车位数据
    console.log('\n🚗 检查停车位数据:');
    const parkingSpaces = await prisma.parkingSpace.findMany({
      where: { projectId: PROJECT_ID }
    });
    console.log(`   📊 停车位总数: ${parkingSpaces.length}`);
    const soldParking = parkingSpaces.filter(p => p.salesStatus === 'SOLD').length;
    const availableParking = parkingSpaces.filter(p => p.salesStatus === 'AVAILABLE').length;
    console.log(`   🟢 可用: ${availableParking}个`);
    console.log(`   🔴 已售: ${soldParking}个`);
    
    // 3. 检查销控数据
    console.log('\n🏢 检查销控数据:');
    const salesControl = await prisma.salesControl.findMany({
      where: { projectId: PROJECT_ID },
      include: {
        salesPersonnel: {
          select: { name: true, employeeNo: true }
        }
      }
    });
    console.log(`   📊 销控记录总数: ${salesControl.length}`);
    const soldUnits = salesControl.filter(s => s.salesStatus === 'SOLD').length;
    const depositUnits = salesControl.filter(s => s.salesStatus === 'DEPOSIT').length;
    const availableUnits = salesControl.filter(s => s.salesStatus === 'AVAILABLE').length;
    console.log(`   🟢 可售: ${availableUnits}套`);
    console.log(`   🟡 订金: ${depositUnits}套`);
    console.log(`   🔴 已售: ${soldUnits}套`);
    
    // 按楼栋统计
    const buildingStats = {};
    salesControl.forEach(unit => {
      if (!buildingStats[unit.building]) {
        buildingStats[unit.building] = 0;
      }
      buildingStats[unit.building]++;
    });
    console.log('   🏗️ 楼栋分布:');
    Object.entries(buildingStats).forEach(([building, count]) => {
      console.log(`      ${building}: ${count}套`);
    });
    
    // 4. 检查预约数据
    console.log('\n📅 检查预约数据:');
    const appointments = await prisma.customerAppointment.findMany({
      where: { projectId: PROJECT_ID },
      include: {
        salesPersonnel: {
          select: { name: true, employeeNo: true }
        }
      }
    });
    console.log(`   📊 预约记录总数: ${appointments.length}`);
    const statusStats = {};
    appointments.forEach(apt => {
      if (!statusStats[apt.status]) {
        statusStats[apt.status] = 0;
      }
      statusStats[apt.status]++;
    });
    console.log('   📈 状态分布:');
    Object.entries(statusStats).forEach(([status, count]) => {
      const statusName = {
        'PENDING': '待确认',
        'CONFIRMED': '已确认', 
        'COMPLETED': '已完成',
        'CANCELLED': '已取消'
      }[status] || status;
      console.log(`      ${statusName}: ${count}条`);
    });
    
    // 5. 检查已购客户数据
    console.log('\n👥 检查已购客户数据:');
    const purchasedCustomers = await prisma.purchasedCustomer.findMany({
      where: { projectId: PROJECT_ID },
      include: {
        salesPersonnel: {
          select: { name: true, employeeNo: true }
        }
      }
    });
    console.log(`   📊 已购客户总数: ${purchasedCustomers.length}`);
    const ratingStats = {};
    purchasedCustomers.forEach(customer => {
      if (!ratingStats[customer.rating]) {
        ratingStats[customer.rating] = 0;
      }
      ratingStats[customer.rating]++;
    });
    console.log('   ⭐ 评级分布:');
    Object.entries(ratingStats).forEach(([rating, count]) => {
      console.log(`      ${rating}级: ${count}人`);
    });
    
    // 6. 检查退户记录数据
    console.log('\n↩️ 检查退户记录数据:');
    const withdrawalRecords = await prisma.withdrawalRecord.findMany({
      where: { projectId: PROJECT_ID }
    });
    console.log(`   📊 退户记录总数: ${withdrawalRecords.length}`);
    const withdrawalStatusStats = {};
    withdrawalRecords.forEach(record => {
      if (!withdrawalStatusStats[record.status]) {
        withdrawalStatusStats[record.status] = 0;
      }
      withdrawalStatusStats[record.status]++;
    });
    console.log('   📊 处理状态分布:');
    Object.entries(withdrawalStatusStats).forEach(([status, count]) => {
      const statusName = {
        'PENDING': '待处理',
        'APPROVED': '已批准',
        'REJECTED': '已拒绝',
        'COMPLETED': '已完成'
      }[status] || status;
      console.log(`      ${statusName}: ${count}条`);
    });
    
    // 7. 数据完整性检查
    console.log('\n🔍 数据完整性检查:');
    
    // 检查销控数据中的销售员ID是否有效
    const invalidSalesIds = salesControl.filter(s => s.salesId && !s.salesPersonnel);
    if (invalidSalesIds.length > 0) {
      console.log(`   ⚠️ 发现 ${invalidSalesIds.length} 条销控记录的销售员ID无效`);
    } else {
      console.log(`   ✅ 所有销控记录的销售员ID都有效`);
    }
    
    // 检查预约数据中的销售员ID是否有效
    const invalidAppointmentSalesIds = appointments.filter(a => a.salesPersonId && !a.salesPersonnel);
    if (invalidAppointmentSalesIds.length > 0) {
      console.log(`   ⚠️ 发现 ${invalidAppointmentSalesIds.length} 条预约记录的销售员ID无效`);
    } else {
      console.log(`   ✅ 所有预约记录的销售员ID都有效`);
    }
    
    // 8. 总结
    console.log('\n📋 数据生成总结:');
    console.log(`   👨‍💼 销售人员: ${salesPersonnel.length}名`);
    console.log(`   🚗 停车位: ${parkingSpaces.length}个`);
    console.log(`   🏢 销控记录: ${salesControl.length}套`);
    console.log(`   📅 预约记录: ${appointments.length}条`);
    console.log(`   👥 已购客户: ${purchasedCustomers.length}名`);
    console.log(`   ↩️ 退户记录: ${withdrawalRecords.length}条`);
    
    const totalRecords = salesPersonnel.length + parkingSpaces.length + salesControl.length + 
                        appointments.length + purchasedCustomers.length + withdrawalRecords.length;
    console.log(`   📊 总记录数: ${totalRecords}条`);
    
    if (totalRecords > 0) {
      console.log('\n🎉 数据验证完成！数据已成功保存到数据库中。');
    } else {
      console.log('\n❌ 数据库中没有找到生成的数据，请检查数据生成过程。');
    }
    
  } catch (error) {
    console.error('❌ 数据验证失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 清理测试数据函数
async function clearTestData() {
  console.log('🧹 清理测试数据...\n');
  
  try {
    console.log('⚠️ 这将删除项目中的所有测试数据，请确认！');
    console.log('删除顺序（避免外键约束）:');
    
    // 按依赖关系反向删除
    console.log('1. 删除退户记录...');
    const deletedWithdrawals = await prisma.withdrawalRecord.deleteMany({
      where: { projectId: PROJECT_ID }
    });
    console.log(`   ✅ 删除了 ${deletedWithdrawals.count} 条退户记录`);
    
    console.log('2. 删除已购客户...');
    const deletedCustomers = await prisma.purchasedCustomer.deleteMany({
      where: { projectId: PROJECT_ID }
    });
    console.log(`   ✅ 删除了 ${deletedCustomers.count} 名已购客户`);
    
    console.log('3. 删除预约记录...');
    const deletedAppointments = await prisma.appointment.deleteMany({
      where: { projectId: PROJECT_ID }
    });
    console.log(`   ✅ 删除了 ${deletedAppointments.count} 条预约记录`);
    
    console.log('4. 删除销控记录...');
    const deletedSalesControl = await prisma.salesControl.deleteMany({
      where: { projectId: PROJECT_ID }
    });
    console.log(`   ✅ 删除了 ${deletedSalesControl.count} 条销控记录`);
    
    console.log('5. 删除停车位...');
    const deletedParking = await prisma.parkingSpace.deleteMany({
      where: { projectId: PROJECT_ID }
    });
    console.log(`   ✅ 删除了 ${deletedParking.count} 个停车位`);
    
    console.log('6. 删除销售人员...');
    const deletedSalesPersonnel = await prisma.salesPersonnel.deleteMany({
      where: {
        projectIds: { contains: PROJECT_ID.toString() }
      }
    });
    console.log(`   ✅ 删除了 ${deletedSalesPersonnel.count} 名销售人员`);
    
    console.log('\n🎉 测试数据清理完成！');
    
  } catch (error) {
    console.error('❌ 清理数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
if (args.includes('--clear')) {
  clearTestData();
} else if (args.includes('--help')) {
  console.log(`
📋 数据库验证脚本使用说明

用法:
  node scripts/verify-database-data.js [选项]

选项:
  --help     显示帮助信息
  --clear    清理所有测试数据
  (无参数)   验证数据库中的数据

功能:
  ✅ 检查各模块数据数量
  ✅ 验证数据完整性
  ✅ 显示数据分布统计
  ✅ 检查数据关联关系
  ✅ 提供数据清理功能

示例:
  node scripts/verify-database-data.js           # 验证数据
  node scripts/verify-database-data.js --clear   # 清理数据
  `);
} else {
  verifyDatabaseData();
}

module.exports = {
  verifyDatabaseData,
  clearTestData
};
