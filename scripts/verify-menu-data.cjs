const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyMenuData() {
  try {
    console.log('🔍 验证菜单数据...\n');

    // 获取所有菜单
    const allMenus = await prisma.menu.findMany({
      include: {
        parent: true,
        children: true,
        rolePermissions: {
          include: {
            role: true
          }
        }
      },
      orderBy: [
        { parentId: 'asc' },
        { sortOrder: 'asc' }
      ]
    });

    console.log(`📊 总菜单数: ${allMenus.length}`);
    console.log(`📁 根菜单数: ${allMenus.filter(m => !m.parentId).length}`);
    console.log(`📄 子菜单数: ${allMenus.filter(m => m.parentId).length}`);
    console.log(`✅ 启用菜单数: ${allMenus.filter(m => m.isActive).length}`);
    console.log(`❌ 停用菜单数: ${allMenus.filter(m => !m.isActive).length}\n`);

    // 显示菜单层级结构
    console.log('🌳 菜单层级结构:');
    const rootMenus = allMenus.filter(m => !m.parentId);
    
    function printMenu(menu, level = 0) {
      const indent = '  '.repeat(level);
      const status = menu.isActive ? '✅' : '❌';
      const icon = menu.icon ? `@${menu.icon}` : '';
      console.log(`${indent}${status} ${menu.displayName} (${menu.name}) ${icon}`);
      console.log(`${indent}   路径: ${menu.path}`);
      console.log(`${indent}   排序: ${menu.sortOrder}`);
      
      if (menu.children && menu.children.length > 0) {
        console.log(`${indent}   子菜单数: ${menu.children.length}`);
        menu.children.forEach(child => printMenu(child, level + 1));
      }
      console.log('');
    }

    rootMenus.forEach(menu => printMenu(menu));

    // 验证特定菜单是否存在
    const expectedMenus = [
      'statistics',
      'sales-control-group',
      'sales-control',
      'sales-overview',
      'parking',
      'appointments',
      'customers',
      'sales-personnel',
      'questionnaire',
      'financial',
      'financial-overview',
      'budget',
      'expenses',
      'commission',
      'handover',
      'withdrawal'
    ];

    console.log('🔍 验证预期菜单:');
    const existingMenuNames = allMenus.map(m => m.name);
    expectedMenus.forEach(menuName => {
      const exists = existingMenuNames.includes(menuName);
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${menuName}`);
    });

    // 验证层级关系
    console.log('\n🔗 验证层级关系:');
    const salesControlGroup = allMenus.find(m => m.name === 'sales-control-group');
    if (salesControlGroup) {
      console.log(`✅ 銷控總表 (${salesControlGroup.name})`);
      console.log(`   子菜单数: ${salesControlGroup.children.length}`);
      salesControlGroup.children.forEach(child => {
        console.log(`   └─ ${child.displayName} (${child.name})`);
      });
    }

    const financialGroup = allMenus.find(m => m.name === 'financial');
    if (financialGroup) {
      console.log(`✅ 財務系統 (${financialGroup.name})`);
      console.log(`   子菜单数: ${financialGroup.children.length}`);
      financialGroup.children.forEach(child => {
        console.log(`   └─ ${child.displayName} (${child.name})`);
      });
    }

    console.log('\n✅ 菜单数据验证完成！');

  } catch (error) {
    console.error('❌ 验证失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行验证
if (require.main === module) {
  verifyMenuData();
}

module.exports = { verifyMenuData };


