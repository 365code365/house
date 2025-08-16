const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const menuData = [
  {
    name: 'statistics',
    displayName: '數據統計',
    path: '/statistics',
    icon: 'BarChartOutlined',
    sortOrder: 1,
    isActive: true,
    children: []
  },
  {
    name: 'sales-control-group',
    displayName: '銷控總表',
    path: '/sales-control-group',
    icon: 'AppstoreOutlined',
    sortOrder: 2,
    isActive: true,
    children: [
      {
        name: 'sales-control',
        displayName: '銷控管理',
        path: '/sales-control',
        icon: 'AppstoreOutlined',
        sortOrder: 1,
        isActive: true
      },
      {
        name: 'sales-overview',
        displayName: '銷售概況',
        path: '/sales-overview',
        icon: 'EyeOutlined',
        sortOrder: 2,
        isActive: true
      },
      {
        name: 'parking',
        displayName: '停車位總表',
        path: '/parking',
        icon: 'CarOutlined',
        sortOrder: 3,
        isActive: true
      }
    ]
  },
  {
    name: 'appointments',
    displayName: '客戶預約',
    path: '/appointments',
    icon: 'CalendarOutlined',
    sortOrder: 3,
    isActive: true,
    children: []
  },
  {
    name: 'customers',
    displayName: '已購客名單',
    path: '/purchased-customers',
    icon: 'TeamOutlined',
    sortOrder: 4,
    isActive: true,
    children: []
  },
  {
    name: 'sales-personnel',
    displayName: '銷售人員管理',
    path: '/sales-personnel',
    icon: 'UserOutlined',
    sortOrder: 5,
    isActive: true,
    children: []
  },
  {
    name: 'questionnaire',
    displayName: '訪客問卷',
    path: '/visitor-questionnaire',
    icon: 'FileTextOutlined',
    sortOrder: 6,
    isActive: true,
    children: []
  },
  {
    name: 'financial',
    displayName: '財務系統',
    path: '/financial-group',
    icon: 'DollarOutlined',
    sortOrder: 7,
    isActive: true,
    children: [
      {
        name: 'financial-overview',
        displayName: '財務總覽',
        path: '/financial',
        icon: 'DollarOutlined',
        sortOrder: 1,
        isActive: true
      },
      {
        name: 'budget',
        displayName: '預算規劃',
        path: '/budget',
        icon: 'BankOutlined',
        sortOrder: 2,
        isActive: true
      },
      {
        name: 'expenses',
        displayName: '支出管理',
        path: '/expenses',
        icon: 'CreditCardOutlined',
        sortOrder: 3,
        isActive: true
      },
      {
        name: 'commission',
        displayName: '請傭列表',
        path: '/commission',
        icon: 'MoneyCollectOutlined',
        sortOrder: 4,
        isActive: true
      }
    ]
  },
  {
    name: 'handover',
    displayName: '點交屋管理',
    path: '/handover',
    icon: 'FileOutlined',
    sortOrder: 8,
    isActive: true,
    children: []
  },
  {
    name: 'withdrawal',
    displayName: '退戶記錄',
    path: '/withdrawal',
    icon: 'FallOutlined',
    sortOrder: 9,
    isActive: true,
    children: []
  }
];

async function importMenus() {
  try {
    console.log('開始清除現有菜單數據...');
    
    // 清除現有菜單數據
    await prisma.menu.deleteMany({});
    console.log('現有菜單數據已清除');
    
    console.log('開始導入新菜單數據...');
    
    // 導入父級菜單
    for (const menuItem of menuData) {
      const { children, ...parentData } = menuItem;
      
      const parentMenu = await prisma.menu.create({
        data: {
          ...parentData,
          parentId: null
        }
      });
      
      console.log(`已創建父級菜單: ${parentMenu.displayName}`);
      
      // 導入子級菜單
      if (children && children.length > 0) {
        for (const childItem of children) {
          const childMenu = await prisma.menu.create({
            data: {
              ...childItem,
              parentId: parentMenu.id
            }
          });
          
          console.log(`  已創建子級菜單: ${childMenu.displayName}`);
        }
      }
    }
    
    console.log('菜單數據導入完成！');
    
  } catch (error) {
    console.error('導入菜單數據時發生錯誤:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 執行導入
importMenus();