const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 菜单树结构数据
const menuTree = [
  {
    name: "statistics",
    displayName: "數據統計",
    path: "/statistics",
    icon: "BarChartOutlined",
    sortOrder: 1,
    isActive: true,
    children: []
  },
  {
    name: "sales-control-group",
    displayName: "銷控總表",
    path: "/sales-control-group",
    icon: "AppstoreOutlined",
    sortOrder: 2,
    isActive: true,
    children: [
      {
        name: "sales-control",
        displayName: "銷控管理",
        path: "/sales-control",
        icon: "AppstoreOutlined",
        sortOrder: 1,
        isActive: true
      },
      {
        name: "sales-overview",
        displayName: "銷售概況",
        path: "/sales-overview",
        icon: "EyeOutlined",
        sortOrder: 2,
        isActive: true
      },
      {
        name: "parking",
        displayName: "停車位總表",
        path: "/parking",
        icon: "CarOutlined",
        sortOrder: 3,
        isActive: true
      }
    ]
  },
  {
    name: "appointments",
    displayName: "客戶預約",
    path: "/appointments",
    icon: "CalendarOutlined",
    sortOrder: 3,
    isActive: true,
    children: []
  },
  {
    name: "customers",
    displayName: "已購客名單",
    path: "/purchased-customers",
    icon: "TeamOutlined",
    sortOrder: 4,
    isActive: true,
    children: []
  },
  {
    name: "sales-personnel",
    displayName: "銷售人員管理",
    path: "/sales-personnel",
    icon: "UserOutlined",
    sortOrder: 5,
    isActive: true,
    children: []
  },
  {
    name: "questionnaire",
    displayName: "訪客問卷",
    path: "/visitor-questionnaire",
    icon: "FileTextOutlined",
    sortOrder: 6,
    isActive: true,
    children: []
  },
  {
    name: "financial",
    displayName: "財務系統",
    path: "/financial-group",
    icon: "DollarOutlined",
    sortOrder: 7,
    isActive: true,
    children: [
      {
        name: "financial-overview",
        displayName: "財務總覽",
        path: "/financial",
        icon: "DollarOutlined",
        sortOrder: 1,
        isActive: true
      },
      {
        name: "budget",
        displayName: "預算規劃",
        path: "/budget",
        icon: "BankOutlined",
        sortOrder: 2,
        isActive: true
      },
      {
        name: "expenses",
        displayName: "支出管理",
        path: "/expenses",
        icon: "CreditCardOutlined",
        sortOrder: 3,
        isActive: true
      },
      {
        name: "commission",
        displayName: "請傭列表",
        path: "/commission",
        icon: "MoneyCollectOutlined",
        sortOrder: 4,
        isActive: true
      }
    ]
  },
  {
    name: "handover",
    displayName: "點交屋管理",
    path: "/handover",
    icon: "FileOutlined",
    sortOrder: 8,
    isActive: true,
    children: []
  },
  {
    name: "withdrawal",
    displayName: "退戶記錄",
    path: "/withdrawal",
    icon: "FallOutlined",
    sortOrder: 9,
    isActive: true,
    children: []
  }
];

// 递归创建菜单
async function createMenu(menuData, parentId = null) {
  try {
    // 创建当前菜单
    const menu = await prisma.menu.create({
      data: {
        name: menuData.name,
        displayName: menuData.displayName,
        path: menuData.path,
        icon: menuData.icon,
        parentId: parentId,
        sortOrder: menuData.sortOrder,
        isActive: menuData.isActive
      }
    });

    console.log(`✅ 创建菜单: ${menu.displayName} (${menu.name})`);

    // 递归创建子菜单
    if (menuData.children && menuData.children.length > 0) {
      for (const childMenu of menuData.children) {
        await createMenu(childMenu, menu.id);
      }
    }

    return menu;
  } catch (error) {
    console.error(`❌ 创建菜单失败: ${menuData.displayName}`, error);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始初始化菜单结构...');

    // 清空现有菜单数据
    console.log('🗑️  清空现有菜单数据...');
    await prisma.roleMenuPermission.deleteMany();
    await prisma.buttonPermission.deleteMany();
    await prisma.menu.deleteMany();

    console.log('✅ 现有菜单数据已清空');

    // 创建菜单结构
    console.log('📝 创建菜单结构...');
    for (const menuData of menuTree) {
      await createMenu(menuData);
    }

    console.log('✅ 菜单结构初始化完成！');

    // 显示创建的菜单
    const allMenus = await prisma.menu.findMany({
      include: {
        parent: true,
        children: true
      },
      orderBy: [
        { parentId: 'asc' },
        { sortOrder: 'asc' }
      ]
    });

    console.log('\n📊 菜单结构概览:');
    allMenus.forEach(menu => {
      const indent = menu.parentId ? '  └─ ' : '';
      const status = menu.isActive ? '✅' : '❌';
      console.log(`${indent}${status} ${menu.displayName} (${menu.name}) - ${menu.path}`);
    });

  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { menuTree, createMenu };


