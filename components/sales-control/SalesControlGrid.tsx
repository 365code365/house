'use client'

import {useState} from 'react'
import {
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    CalendarOutlined,
    DollarOutlined,
    HomeOutlined,
    DownOutlined
} from '@ant-design/icons'
import {
    Card,
    Button,
    Badge,
    Modal,
    Input,
    Select,
    Typography,
    Row,
    Col,
    Space,
    message,
    Checkbox,
    Dropdown,
    MenuProps
} from 'antd'
import {formatCurrency, formatDate} from '@/lib/utils'
import styles from './SalesControlGrid.module.css'
import { useUpdateSalesControl, useBatchUpdateSalesControl, useDeleteSalesControl } from '@/hooks/useSalesControl'

const {Title, Text} = Typography
const {Option} = Select
const {TextArea} = Input

interface SalesControlData {
    id: number
    project_id: number
    building: string
    floor: number
    unit: string
    house_no: string
    area: string
    unit_price: string
    house_total: string
    total_with_parking: string
    base_price: string
    premium_rate: string
    sales_status: string
    sales_date: string
    deposit_date: string
    sign_date: string
    buyer: string
    sales_id: string
    sales_person_name: string
    sales_person_employee_no: string
    parking_ids: string
    custom_change: number
    custom_change_content: string | null
    media_source: string | null
    introducer: string | null
    notes: string
    createdAt: string
  updatedAt: string
    parking_spaces: any[]
}

interface SalesControlGridProps {
    data: SalesControlData[]
    onDataChange: () => void
    projectId: string
}

const statusColors = {
    '售出': 'success',
    '訂金': 'warning',
    '未售出': 'default',
    '不銷售': 'error'
} as const

export default function SalesControlGrid({data, onDataChange, projectId}: SalesControlGridProps) {
    const [selectedUnit, setSelectedUnit] = useState<SalesControlData | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false)
    const [editData, setEditData] = useState<Partial<SalesControlData>>({})
    const [editModalVisible, setEditModalVisible] = useState(false)
    
    // 批量操作相关状态
    const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
    const [batchEditModalOpen, setBatchEditModalOpen] = useState(false)
    const [batchEditData, setBatchEditData] = useState<Partial<SalesControlData>>({})

    // Hooks
    const updateMutation = useUpdateSalesControl(parseInt(projectId))
    const batchUpdateMutation = useBatchUpdateSalesControl(parseInt(projectId))
    const deleteMutation = useDeleteSalesControl(parseInt(projectId))

    // 按樓層分組數據
    const groupedData = data.reduce((acc, item) => {
        const key = `${item.building}-${item.floor}`
        if (!acc[key]) {
            acc[key] = []
        }
        acc[key].push(item)
        return acc
    }, {} as Record<string, SalesControlData[]>)

    const handleEdit = (unit: SalesControlData) => {
        setSelectedUnit(unit)
        setEditData(unit)
        setIsEditDialogOpen(true)
    }

    const handleWithdraw = (unit: SalesControlData) => {
        setSelectedUnit(unit)
        setIsWithdrawDialogOpen(true)
    }

    const handleSaveEdit = async () => {
        if (!selectedUnit) return

        updateMutation.mutate(
            { id: selectedUnit.id, updates: editData },
            {
                onSuccess: () => {
                    message.success('更新成功')
                    setIsEditDialogOpen(false)
                    setSelectedUnit(null)
                    setEditData({})
                    onDataChange()
                },
                onError: (error: any) => {
                    message.error(error.message || '更新失败')
                }
            }
        )
    }

    const handleConfirmWithdraw = async () => {
        if (!selectedUnit) return

        deleteMutation.mutate(
            selectedUnit.id,
            {
                onSuccess: () => {
                    message.success('退戶處理完成')
                    setIsWithdrawDialogOpen(false)
                    setSelectedUnit(null)
                    onDataChange()
                },
                onError: (error: any) => {
                    message.error(error.message || '退戶處理失敗')
                }
            }
        )
    }

    // 批量操作处理函数
    const handleBatchEdit = () => {
        setBatchEditData({})
        setBatchEditModalOpen(true)
    }

    const handleBatchSave = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('请先选择要编辑的房屋')
            return
        }

        // 过滤掉空值
        const filteredData = Object.fromEntries(
            Object.entries(batchEditData).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        )

        if (Object.keys(filteredData).length === 0) {
            message.warning('请至少填写一个要更新的字段')
            return
        }

        batchUpdateMutation.mutate(
            { ids: selectedRowKeys, updates: filteredData },
            {
                onSuccess: () => {
                    message.success('批量更新成功')
                    setBatchEditModalOpen(false)
                    setSelectedRowKeys([])
                    setBatchEditData({})
                    onDataChange()
                },
                onError: (error: any) => {
                    message.error(error.message || '批量更新失败')
                }
            }
        )
    }

    const handleBatchStatusChange = async (status: string) => {
        if (selectedRowKeys.length === 0) {
            message.warning('请先选择要更新的房屋')
            return
        }

        batchUpdateMutation.mutate(
            { ids: selectedRowKeys, updates: { sales_status: status } },
            {
                onSuccess: () => {
                    message.success(`批量更新为${status}成功`)
                    setSelectedRowKeys([])
                    onDataChange()
                },
                onError: (error: any) => {
                    message.error(error.message || '批量更新失败')
                }
            }
        )
    }

    // 批量操作菜单项
    const batchMenuItems: MenuProps['items'] = [
        {
            key: 'edit',
            label: '批量编辑',
            onClick: handleBatchEdit
        },
        {
            type: 'divider'
        },
        {
            key: 'status-sold',
            label: '标记为已售出',
            onClick: () => handleBatchStatusChange('售出')
        },
        {
            key: 'status-deposit',
            label: '标记为订金',
            onClick: () => handleBatchStatusChange('訂金')
        },
        {
            key: 'status-available',
            label: '标记为未售出',
            onClick: () => handleBatchStatusChange('未售出')
        },
        {
            key: 'status-unavailable',
            label: '标记为不销售',
            onClick: () => handleBatchStatusChange('不銷售')
        }
    ]

    return (
        <div className={styles.container}>
            {/* 批量操作栏 */}
            {selectedRowKeys.length > 0 && (
                <Card 
                    style={{ 
                        marginBottom: 16, 
                        backgroundColor: '#f0f9ff', 
                        borderColor: '#1890ff' 
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                            <Text strong>已选择 {selectedRowKeys.length} 个房屋</Text>
                            <Button 
                                size="small" 
                                onClick={() => setSelectedRowKeys([])}
                            >
                                取消选择
                            </Button>
                        </Space>
                        <Space>
                            <Dropdown menu={{ items: batchMenuItems }} trigger={['click']}>
                                <Button type="primary">
                                    批量操作 <DownOutlined />
                                </Button>
                            </Dropdown>
                        </Space>
                    </div>
                </Card>
            )}
            
            {Object.entries(groupedData).map(([floorKey, units]) => {
                const [building, floor] = floorKey.split('-')
                return (
                    <Card key={floorKey}>
                        <Card.Meta
                            title={
                                <Space>
                                    <HomeOutlined/>
                                    <span>{building}棟 {floor}樓</span>
                                    <Badge count={units.length} showZero color="blue"/>
                                </Space>
                            }
                        />
                        <div style={{marginTop: '16px'}}>
                            <Row gutter={[16, 16]}>
                                {units.map((unit) => (
                                    <Col xs={24} sm={12} md={12} lg={12} xl={12} key={unit.id}>
                                        <Card
                                            hoverable
                                            className={`${styles.unitCard} ${selectedRowKeys.includes(unit.id) ? styles.selectedCard : ''}`}
                                            styles={{body: {padding: '12px'}}}
                                        >
                                            <div className={styles.cardContent}>
                                                {/* 房號標題 */}
                                                <div className={styles.cardHeader}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <Checkbox
                                                            checked={selectedRowKeys.includes(unit.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedRowKeys(prev => [...prev, unit.id])
                                                                } else {
                                                                    setSelectedRowKeys(prev => prev.filter(id => id !== unit.id))
                                                                }
                                                            }}
                                                        />
                                                        <Title level={5} className={styles.unitTitle}>
                                                            {unit.house_no}
                                                        </Title>
                                                    </div>
                                                    <div className={styles.actionButtons}>
                                                        <Button
                                                            size="small"
                                                            icon={<EditOutlined/>}
                                                            onClick={() => handleEdit(unit)}
                                                            className={styles.actionButton}
                                                        />
                                                        {unit.sales_status === '售出' && (
                                                            <Button
                                                                size="small"
                                                                danger
                                                                onClick={() => handleWithdraw(unit)}
                                                                className={styles.withdrawButton}
                                                            >
                                                                退戶
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className={styles.cardDetails}>
                                                    <table className={styles.detailTable}>
                                                        <tbody>
                                                        <tr>
                                                            <th>買方姓名</th>
                                                            <td>{unit.buyer || '-'}</td>
                                                            <th>下訂日期</th>
                                                            <td>{unit.deposit_date ? formatDate(unit.deposit_date) : '-'}</td>
                                                            <th>簽約日期</th>
                                                            <td>{unit.sign_date ? formatDate(unit.sign_date) : '-'}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>銷售狀況</th>
                                                            <td>{unit.sales_status === '售出' ? '已售出' : unit.sales_status}</td>
                                                            <th>單位價格</th>
                                                            <td>{unit.house_total ? formatCurrency(parseFloat(unit.house_total)) : '-'}</td>
                                                            <th>每坪單價</th>
                                                            <td>{unit.unit_price ? formatCurrency(parseFloat(unit.unit_price)) : '-'}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>銷售人員</th>
                                                            <td>{unit.sales_person_name || '-'}</td>
                                                            <th>房價</th>
                                                            <td>{unit.house_total ? formatCurrency(parseFloat(unit.house_total)) : '-'}</td>
                                                            <th>客變需求</th>
                                                            <td>{unit.custom_change ? '是' : '否'}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>坪數</th>
                                                            <td>{unit.area ? `${unit.area}坪` : '-'}</td>
                                                            <th>含車位總價</th>
                                                            <td>{unit.total_with_parking ? formatCurrency(parseFloat(unit.total_with_parking)) : '-'}</td>
                                                            <th>家電贈送</th>
                                                            <td>-</td>
                                                        </tr>
                                                        <tr>
                                                            <th>車位號碼</th>
                                                            <td>{unit.parking_spaces && unit.parking_spaces.length > 0 
                                                                ? unit.parking_spaces.map((ps: any) => ps.parking_no).join(', ') 
                                                                : '-'}</td>
                                                            <th>底價</th>
                                                            <td>{unit.base_price ? formatCurrency(parseFloat(unit.base_price)) : '-'}</td>
                                                            <th>溢價率</th>
                                                            <td>{unit.premium_rate ? `${unit.premium_rate}%` : '-'}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>客變內容</th>
                                                            <td>{unit.custom_change_content ? unit.custom_change_content.replace(/\n/g, ' ').replace(/\r/g, ' ') : '-'}</td>
                                                            <th>備註</th>
                                                            <td colSpan={3}>{unit.notes ? unit.notes.replace(/\n/g, ' ').replace(/\r/g, ' ') : '-'}</td>
                                                        </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    </Card>
                )
            })}

            {/* 編輯對話框 */}
            <Modal
                title={`編輯房屋資訊 - ${selectedUnit?.house_no}`}
                open={isEditDialogOpen}
                onCancel={() => setIsEditDialogOpen(false)}
                onOk={handleSaveEdit}
                okText="儲存"
                cancelText="取消"
                width={1200}
                className={styles.editModal}
                styles={{body: {maxHeight: '70vh', overflowY: 'auto'}}}
            >
                <div className={styles.editFormGrid}>
                    <Row gutter={[16, 16]}>
                        {/* 買方姓名 - 佔一整行，右側有退戶按鈕 */}
                        <Col span={24}>
                            <div style={{marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px'}}>
                                <div style={{flex: 1}}>
                                    <Text>買方姓名</Text>
                                    <Input
                                        value={editData.buyer || ''}
                                        onChange={(e) => setEditData(prev => ({...prev, buyer: e.target.value}))}
                                        style={{marginTop: '4px'}}
                                        disabled
                                        placeholder="從買方資訊提取所有買家姓名，並以逗號隔開"
                                    />
                                </div>
                                {editData.sales_status === '售出' && (
                                    <Button
                                        danger
                                        onClick={() => handleWithdraw(selectedUnit!)}
                                        style={{marginTop: '20px'}}
                                    >
                                        退戶
                                    </Button>
                                )}
                            </div>
                        </Col>

                        {/* 第一列 */}
                        <Col span={8}>
                            <div style={{marginBottom: '16px'}}>
                                <Text>買方人數</Text>
                                <Select
                                    value={1}
                                    onChange={(value) => {}}
                                    style={{width: '100%', marginTop: '4px'}}
                                >
                                    <Option value={0}>0人</Option>
                                    <Option value={1}>1人</Option>
                                    <Option value={2}>2人</Option>
                                    <Option value={3}>3人</Option>
                                    <Option value={4}>4人</Option>
                                    <Option value={5}>5人</Option>
                                </Select>
                            </div>
                        </Col>
                        <Col span={8}>
                            <div style={{marginBottom: '16px'}}>
                                <Text>下訂日期</Text>
                                <Input
                                    type="date"
                                    value={editData.deposit_date || ''}
                                    onChange={(e) => setEditData(prev => ({...prev, deposit_date: e.target.value}))}
                                    style={{marginTop: '4px'}}
                                />
                            </div>
                        </Col>
                        <Col span={8}>
                            <div style={{marginBottom: '16px'}}>
                                <Text>簽約日期</Text>
                                <Input
                                    type="date"
                                    value={editData.sign_date || ''}
                                    onChange={(e) => setEditData(prev => ({...prev, sign_date: e.target.value}))}
                                    style={{marginTop: '4px'}}
                                />
                            </div>
                        </Col>

                        {/* 第二列 */}
                        <Col span={8}>
                            <div style={{marginBottom: '16px'}}>
                                <Text>銷售狀況</Text>
                                <Select
                                    value={editData.sales_status || ''}
                                    onChange={(value) => setEditData(prev => ({...prev, sales_status: value}))}
                                    style={{width: '100%', marginTop: '4px'}}

                                >
                                    <Option value="售出">售出</Option>
                                    <Option value="訂金">訂金</Option>
                                    <Option value="不銷售">不銷售</Option>
                                    <Option value="未售出">未售出</Option>
                                </Select>
                            </div>
                        </Col>
                        <Col span={8}>
                            <div style={{marginBottom: '16px'}}>
                                <Text>車位價格(萬元)</Text>
                                <Input
                                    value="-"
                                    style={{marginTop: '4px'}}
                                    disabled
                                    placeholder="由車位號碼自動計算"
                                />
                            </div>
                        </Col>
                        <Col span={8}>
                            <div style={{marginBottom: '16px'}}>
                                <Text>每坪單價(萬元)</Text>
                                <Input
                                    type="number"
                                    value={editData.unit_price || ''}
                                    onChange={(e) => setEditData(prev => ({
                                        ...prev,
                                        unit_price: e.target.value
                                    }))}
                                    style={{marginTop: '4px'}}
                                />
                            </div>
                        </Col>

                        {/* 第三列 */}
                        <Col span={8}>
                            <div className={styles.inputGroup}>
                                <Text className={styles.inputLabel}>銷售人員</Text>
                                <Select
                                    value={editData.sales_id || ''}
                                    onChange={(value) => setEditData(prev => ({
                                        ...prev,
                                        sales_id: value
                                    }))}
                                    style={{width: '100%', marginTop: '4px'}}
                                    placeholder="選擇銷售人員"
                                >
                                    {/* TODO: 從銷售人員表單取得，需過濾具有該建案權限的銷售人員 */}
                                    <Option value={1}>銷售員A</Option>
                                    <Option value={2}>銷售員B</Option>
                                    <Option value={3}>銷售員C</Option>
                                </Select>
                            </div>
                        </Col>
                        <Col span={8}>
                            <div className={styles.inputGroup}>
                                <Text className={styles.inputLabel}>房價(萬元)</Text>
                                <Input
                                    type="number"
                                    value={editData.house_total || ''}
                                    onChange={(e) => setEditData(prev => ({
                                        ...prev,
                                        house_total: e.target.value
                                    }))}
                                    style={{marginTop: '4px'}}
                                />
                            </div>
                        </Col>
                        <Col span={8}>
                            <div className={styles.inputGroup}>
                                <Text className={styles.inputLabel}>客變需求</Text>
                                <Select
                                    value={editData.custom_change ? '是' : '否'}
                                    onChange={(value) => setEditData(prev => ({
                                        ...prev,
                                        custom_change: value === '是' ? 1 : 0
                                    }))}
                                    style={{width: '100%', marginTop: '4px'}}
                                >
                                    <Option value="是">是</Option>
                                    <Option value="否">否</Option>
                                </Select>
                            </div>
                        </Col>

                        {/* 第四列 */}
                        <Col span={8}>
                            <div className={styles.inputGroup}>
                                <Text className={styles.inputLabel}>坪數</Text>
                                <Input
                                    type="number"
                                    value={editData.area || ''}
                                    onChange={(e) => setEditData(prev => ({...prev, area: e.target.value}))}
                                    style={{marginTop: '4px'}}
                                />
                            </div>
                        </Col>
                        <Col span={8}>
                            <div className={styles.inputGroup}>
                                <Text className={styles.inputLabel}>媒體來源</Text>
                                <Input
                                    value={editData.media_source || ''}
                                    onChange={(e) => setEditData(prev => ({
                                        ...prev,
                                        media_source: e.target.value
                                    }))}
                                    style={{marginTop: '4px'}}
                                />
                            </div>
                        </Col>
                        <Col span={8}>
                            <div className={styles.inputGroup}>
                                <Text className={styles.inputLabel}>含車位總價(萬元)</Text>
                                <Input
                                    value={editData.total_with_parking ? formatCurrency(parseFloat(editData.total_with_parking)) : ''}
                                    style={{marginTop: '4px'}}
                                    disabled
                                    placeholder="由房價與車位價格自動加總"
                                />
                            </div>
                        </Col>

                        {/* 第五列 */}
                        <Col span={8}>
                            <div className={styles.inputGroup}>
                                <Text className={styles.inputLabel}>車位號碼</Text>
                                <Select
                                    mode="multiple"
                                    value={editData.parking_spaces || []}
                                    onChange={(values) => setEditData(prev => ({...prev, parking_spaces: values}))}
                                    style={{width: '100%', marginTop: '4px'}}
                                    placeholder="選擇車位號碼（可複選）"
                                >
                                    {/* 這裡需要從停車位總表取得，不可選擇已被其他戶綁定的車位 */}
                                    <Option value="A1">A1</Option>
                                    <Option value="A2">A2</Option>
                                    <Option value="B1">B1</Option>
                                    <Option value="B2">B2</Option>
                                </Select>
                            </div>
                        </Col>
                        <Col span={8}>
                            <div className={styles.inputGroup}>
                                <Text className={styles.inputLabel}>底價(萬元)</Text>
                                <Input
                                    type="number"
                                    value={editData.base_price || ''}
                                    onChange={(e) => setEditData(prev => ({
                                        ...prev,
                                        base_price: e.target.value
                                    }))}
                                    style={{marginTop: '4px'}}
                                />
                            </div>
                        </Col>
                        <Col span={8}>
                            <div className={styles.inputGroup}>
                                <Text className={styles.inputLabel}>溢價率</Text>
                                <Input
                                    value={editData.premium_rate ? `${editData.premium_rate}%` : '---'}
                                    style={{marginTop: '4px'}}
                                    disabled
                                    placeholder="(每坪單價-底價)/底價"
                                />
                            </div>
                        </Col>

                        {/* 客變內容 - 佔一整行 */}
                        <Col span={24}>
                            <div className={styles.inputGroup}>
                                <Text className={styles.inputLabel}>客變內容</Text>
                                <TextArea
                                    value={editData.custom_change_content || ''}
                                    onChange={(e) => setEditData(prev => ({...prev, custom_change_content: e.target.value}))}
                                    rows={2}
                                    style={{marginTop: '4px'}}
                                    placeholder="填寫客變具體內容"
                                />
                            </div>
                        </Col>

                        {/* 贈送 - 佔一整行 */}
                        <Col span={24}>
                            <div className={styles.inputGroup}>
                                <Text className={styles.inputLabel}>介紹人</Text>
                                <Input
                                    value={editData.introducer || ''}
                                    onChange={(e) => setEditData(prev => ({...prev, introducer: e.target.value}))}
                                    style={{marginTop: '4px'}}
                                    placeholder="填寫介紹人"
                                />
                            </div>
                        </Col>

                        {/* 備註 - 佔一整行 */}
                        <Col span={24}>
                            <div className={styles.inputGroup}>
                                <Text className={styles.inputLabel}>備註</Text>
                                <TextArea
                                    value={editData.notes || ''}
                                    onChange={(e) => setEditData(prev => ({...prev, notes: e.target.value}))}
                                    rows={3}
                                    style={{marginTop: '4px'}}
                                    placeholder="填寫備註信息"
                                />
                            </div>
                        </Col>
                    </Row>
                </div>
            </Modal>

            {/* 退戶確認對話框 */}
            <Modal
                title="確認退戶"
                open={isWithdrawDialogOpen}
                onCancel={() => setIsWithdrawDialogOpen(false)}
                onOk={handleConfirmWithdraw}
                okText="確認退戶"
                cancelText="取消"
                okButtonProps={{danger: true}}
            >
                <div style={{padding: '16px 0'}}>
                    <p>確定要將 <Text strong>{selectedUnit?.house_no}</Text> 進行退戶處理嗎？</p>
                    <Text type="secondary" style={{fontSize: '14px', marginTop: '8px', display: 'block'}}>
                        退戶後該戶將恢復為未售出狀態，相關資料將移至退戶記錄。
                    </Text>
                </div>
            </Modal>

            {/* 批量编辑对话框 */}
            <Modal
                title={`批量编辑 (${selectedRowKeys.length} 个房屋)`}
                open={batchEditModalOpen}
                onCancel={() => setBatchEditModalOpen(false)}
                onOk={handleBatchSave}
                okText="保存"
                cancelText="取消"
                width={800}
            >
                <div style={{ padding: '16px 0' }}>
                    <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>
                        注意：空白字段将保持原值不变，只有填写的字段会被更新
                    </Text>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <div style={{ marginBottom: '16px' }}>
                                <Text>销售状态</Text>
                                <Select
                                    value={batchEditData.sales_status}
                                    onChange={(value) => setBatchEditData(prev => ({ ...prev, sales_status: value }))}
                                    style={{ width: '100%', marginTop: '4px' }}
                                    placeholder="选择销售状态"
                                    allowClear
                                >
                                    <Option value="售出">售出</Option>
                                    <Option value="訂金">订金</Option>
                                    <Option value="未售出">未售出</Option>
                                    <Option value="不銷售">不销售</Option>
                                </Select>
                            </div>
                        </Col>
                        <Col span={12}>
                            <div style={{ marginBottom: '16px' }}>
                                <Text>销售人员</Text>
                                <Select
                                    value={batchEditData.sales_id}
                                    onChange={(value) => setBatchEditData(prev => ({ ...prev, sales_id: value }))}
                                    style={{ width: '100%', marginTop: '4px' }}
                                    placeholder="选择销售人员"
                                    allowClear
                                >
                                    <Option value="1">销售员A</Option>
                                    <Option value="2">销售员B</Option>
                                    <Option value="3">销售员C</Option>
                                </Select>
                            </div>
                        </Col>
                        <Col span={12}>
                            <div style={{ marginBottom: '16px' }}>
                                <Text>每坪单价(万元)</Text>
                                <Input
                                    type="number"
                                    value={batchEditData.unit_price || ''}
                                    onChange={(e) => setBatchEditData(prev => ({ ...prev, unit_price: e.target.value }))}
                                    style={{ marginTop: '4px' }}
                                    placeholder="输入每坪单价"
                                />
                            </div>
                        </Col>
                        <Col span={12}>
                            <div style={{ marginBottom: '16px' }}>
                                <Text>媒体来源</Text>
                                <Input
                                    value={batchEditData.media_source || ''}
                                    onChange={(e) => setBatchEditData(prev => ({ ...prev, media_source: e.target.value }))}
                                    style={{ marginTop: '4px' }}
                                    placeholder="输入媒体来源"
                                />
                            </div>
                        </Col>
                        <Col span={24}>
                            <div style={{ marginBottom: '16px' }}>
                                <Text>备注</Text>
                                <TextArea
                                    value={batchEditData.notes || ''}
                                    onChange={(e) => setBatchEditData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={3}
                                    style={{ marginTop: '4px' }}
                                    placeholder="输入备注信息"
                                />
                            </div>
                        </Col>
                    </Row>
                </div>
            </Modal>
        </div>
    )
}