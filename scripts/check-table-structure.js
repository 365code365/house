const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTableStructure() {
  try {
    console.log('检查customer_appointment表结构...');
    
    // 使用原始SQL查询表结构
    const tableStructure = await prisma.$queryRaw`
      DESCRIBE customer_appointment
    `;
    
    console.log('customer_appointment表字段:');
    tableStructure.forEach(field => {
      console.log(`- ${field.Field}: ${field.Type} (Null: ${field.Null}, Key: ${field.Key})`);
    });
    
    // 检查外键约束
    console.log('\n检查外键约束...');
    const foreignKeys = await prisma.$queryRaw`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'customer_appointment' 
      AND TABLE_SCHEMA = 'sales_system'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `;
    
    console.log('外键约束:');
    foreignKeys.forEach(fk => {
      console.log(`- ${fk.CONSTRAINT_NAME}: ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
    });
    
    // 检查sales_personnel表的employee_no字段
    console.log('\n检查sales_personnel表结构...');
    const salesPersonnelStructure = await prisma.$queryRaw`
      DESCRIBE sales_personnel
    `;
    
    console.log('sales_personnel表字段:');
    salesPersonnelStructure.forEach(field => {
      console.log(`- ${field.Field}: ${field.Type} (Null: ${field.Null}, Key: ${field.Key})`);
    });
    
  } catch (error) {
    console.error('检查表结构失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTableStructure();