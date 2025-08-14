'use client'

import { Button, Dropdown, Checkbox, Space } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'

interface ColumnVisibilityControlProps {
  visibleColumns: Record<string, boolean>
  onColumnVisibilityChange: (columnKey: string, visible: boolean) => void
}

const ColumnVisibilityControl: React.FC<ColumnVisibilityControlProps> = ({
  visibleColumns,
  onColumnVisibilityChange,
}) => {
  const columnOptions = [
    { key: 'customerName', label: '客戶姓名' },
    { key: 'contactPhone', label: '聯絡電話' },
    { key: 'houseNo', label: '房屋編號' },
    { key: 'houseType', label: '房屋類型' },
    { key: 'purchaseDate', label: '購買日期' },
    { key: 'totalAmount', label: '總金額' },
    { key: 'paymentProgress', label: '付款進度' },
    { key: 'paymentStatus', label: '付款狀態' },
    { key: 'contractStatus', label: '合約狀態' },
    { key: 'handoverStatus', label: '交房狀態' },
    { key: 'salesPerson', label: '銷售人員' },
    { key: 'contractNumber', label: '合約編號' },
    { key: 'loanStatus', label: '貸款狀態' },
    { key: 'rating', label: '客戶評級' },
    { key: 'mailingAddress', label: '郵寄地址' },
    { key: 'lastContactDate', label: '最後聯絡日期' },
    { key: 'nextFollowUpDate', label: '下次追蹤日期' },
  ]

  const items: MenuProps['items'] = [
    {
      key: 'column-visibility',
      label: (
        <div className="p-2">
          <div className="mb-2 font-medium">顯示欄位</div>
          <Space direction="vertical" size="small">
            {columnOptions.map((option) => (
              <Checkbox
                key={option.key}
                checked={visibleColumns[option.key] !== false}
                onChange={(e) => onColumnVisibilityChange(option.key, e.target.checked)}
              >
                {option.label}
              </Checkbox>
            ))}
          </Space>
        </div>
      ),
    },
  ]

  return (
    <Dropdown
      menu={{ items }}
      trigger={['click']}
      placement="bottomRight"
      overlayStyle={{ minWidth: 200 }}
    >
      <Button icon={<SettingOutlined />}>
        欄位設定
      </Button>
    </Dropdown>
  )
}

export default ColumnVisibilityControl