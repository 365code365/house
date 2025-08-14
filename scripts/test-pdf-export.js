// 使用ES模块语法
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// 模拟销售控制数据
const mockData = [
  {
    id: 1,
    project_id: 1,
    building: 'A棟',
    floor: 1,
    unit: '3房2廳2衛',
    house_no: 'A101',
    area: '100',
    unit_price: '500000',
    house_total: '50000000',
    total_with_parking: '52000000',
    base_price: '48000000',
    premium_rate: '4.17%',
    sales_status: 'available',
    sales_date: '',
    deposit_date: '',
    sign_date: '',
    buyer: '',
    sales_id: '',
    sales_person_name: '張三',
    sales_person_employee_no: 'SP001',
    parking_ids: '',
    custom_change: 0,
    custom_change_content: null,
    media_source: null,
    introducer: null,
    notes: '測試數據',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    parking_spaces: []
  },
  {
    id: 2,
    project_id: 1,
    building: 'A棟',
    floor: 1,
    unit: '3房2廳2衛',
    house_no: 'A102',
    area: '120',
    unit_price: '550000',
    house_total: '66000000',
    total_with_parking: '68000000',
    base_price: '62000000',
    premium_rate: '6.45%',
    sales_status: 'sold',
    sales_date: '2024-01-15',
    deposit_date: '2024-01-10',
    sign_date: '2024-01-15',
    buyer: '李四',
    sales_id: 'SP001',
    sales_person_name: '張三',
    sales_person_employee_no: 'SP001',
    parking_ids: 'P001',
    custom_change: 1,
    custom_change_content: '客廳牆面調整',
    media_source: '網路廣告',
    introducer: '王五',
    notes: '客戶滿意',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
    parking_spaces: []
  }
];

// 格式化货币显示
const formatCurrencyForPDF = (value) => {
  if (!value) return '-';
  const num = parseFloat(value);
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(num);
};

// 获取状态文本
const getStatusTextForPDF = (status) => {
  switch (status) {
    case 'available': return '可售';
    case 'reserved': return '預約';
    case 'sold': return '已售';
    case 'withdrawn': return '退戶';
    default: return status;
  }
};

// 创建PDF
const createPDF = () => {
  try {
    console.log('开始创建PDF...');
    
    // 创建PDF文档
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // 设置字体
    pdf.setFont('helvetica');
    pdf.setFontSize(16);

    // 添加标题
    const title = '銷控管理報表';
    const subtitle = '房地產銷售控制數據統計';
    const companyName = '房地產銷控管理系統';
    
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, pdf.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(subtitle, pdf.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.text(companyName, pdf.internal.pageSize.getWidth() - 20, 20, { align: 'right' });
    
    // 添加生成时间
    const currentDate = new Date().toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    pdf.text(`報表生成時間：${currentDate}`, 20, 40);

    // 添加统计摘要
    const totalUnits = mockData.length;
    const soldUnits = mockData.filter(item => item.sales_status === 'sold').length;
    const reservedUnits = mockData.filter(item => item.sales_status === 'reserved').length;
    const availableUnits = mockData.filter(item => item.sales_status === 'available').length;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('統計摘要', 20, 55);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`總戶數：${totalUnits}`, 20, 65);
    pdf.text(`已售戶數：${soldUnits}`, 60, 65);
    pdf.text(`預約戶數：${reservedUnits}`, 100, 65);
    pdf.text(`可售戶數：${availableUnits}`, 140, 65);

    // 准备表格数据
    const tableData = mockData.map(item => [
      item.building || '-',
      item.floor || '-',
      item.house_no || '-',
      item.unit || '-',
      item.area || '-',
      formatCurrencyForPDF(item.unit_price),
      formatCurrencyForPDF(item.total_with_parking),
      getStatusTextForPDF(item.sales_status),
      item.sales_person_name || '-',
      item.buyer || '-',
      item.sign_date || '-'
    ]);

    // 添加表格标题
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('詳細數據列表', 20, 85);

    // 使用autoTable生成表格
    pdf.autoTable({
      head: [['棟別', '樓層', '戶號', '戶型', '面積', '單價', '總價', '狀態', '銷售人員', '客戶', '簽約日期']],
      body: tableData,
      startY: 95,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [24, 144, 255],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 15 }, // 棟別
        1: { cellWidth: 12 }, // 樓層
        2: { cellWidth: 20 }, // 戶號
        3: { cellWidth: 25 }, // 戶型
        4: { cellWidth: 15 }, // 面積
        5: { cellWidth: 20 }, // 單價
        6: { cellWidth: 20 }, // 總價
        7: { cellWidth: 15 }, // 狀態
        8: { cellWidth: 20 }, // 銷售人員
        9: { cellWidth: 20 }, // 客戶
        10: { cellWidth: 20 }, // 簽約日期
      },
      didDrawPage: function (data) {
        // 添加页脚
        pdf.setFontSize(8);
        pdf.text(
          `第 ${data.pageNumber} 頁`,
          pdf.internal.pageSize.getWidth() - 20,
          pdf.internal.pageSize.getHeight() - 10,
          { align: 'right' }
        );
        
        // 添加版权信息
        pdf.text(
          `© ${new Date().getFullYear()} ${companyName} - 銷控管理系統`,
          20,
          pdf.internal.pageSize.getHeight() - 10
        );
      }
    });

    // 保存PDF
    const fileName = `銷控管理報表_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    console.log('PDF创建成功！');
    return true;
  } catch (error) {
    console.error('PDF创建失败:', error);
    return false;
  }
};

// 运行测试
console.log('开始测试PDF导出功能...');
const success = createPDF();
console.log(`测试结果: ${success ? '成功' : '失败'}`);
