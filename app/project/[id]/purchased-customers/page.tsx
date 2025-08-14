'use client'

import {useState, useEffect, useMemo} from 'react'
import {useParams} from 'next/navigation'
import {
    Card,
    Table,
    Button,
    Space,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    DatePicker,
    Popconfirm,
    Tag,
    Progress,
    Drawer,
    App
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ExportOutlined,
    EyeOutlined,
    PhoneOutlined,
    MessageOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {formatCurrency} from '@/lib/utils'
import ImportExportActions from '@/components/purchased-customers/ImportExportActions'
import ColumnVisibilityControl from '@/components/purchased-customers/ColumnVisibilityControl'

const {Option} = Select
const {TextArea} = Input

export interface PurchasedCustomerItem {
    id: number
    projectId: number
    customerName: string
    houseNo: string
    purchaseDate: Date | string | null
    idCard: string | null
    isCorporate: boolean
    email: string | null
    phone: string | null
    age: number | null
    occupation: string | null
    registeredAddress: string | null
    mailingAddress: string | null
    remark: string | null
    rating: 'S' | 'A' | 'B' | 'C' | 'D' | null
    salesPersonId: string | null
    salesPerson: string | null
    createdAt: Date | string
    updatedAt: Date | string
}

interface CustomerFormData {
    customerName: string
    houseNo: string
    purchaseDate: dayjs.Dayjs | null
    idCard: string
    isCorporate: boolean
    email: string
    phone: string
    age: number | null
    occupation: string
    registeredAddress: string
    mailingAddress: string
    remark: string
    rating: 'S' | 'A' | 'B' | 'C' | 'D'
    salesPersonId: string
}

export default function PurchasedCustomersPage() {
    const { message } = App.useApp()
    const params = useParams()
    const projectId = params.id as string
    const [purchasedCustomers, setPurchasedCustomers] = useState<PurchasedCustomerItem[]>([])
    const [salesPersonnel, setSalesPersonnel] = useState<any[]>([]) // 添加销售人员列表状态
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [editingItem, setEditingItem] = useState<PurchasedCustomerItem | null>(null)
    const [viewingItem, setViewingItem] = useState<PurchasedCustomerItem | null>(null)
    const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false)
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
        customerName: true,
        houseNo: true,
        purchaseDate: true,
        phone: true,
        email: true,
        isCorporate: true,
        rating: true,
        salesPerson: true
    })
    const [form] = Form.useForm()

    // 獲取已購客戶列表
    const fetchPurchasedCustomers = async () => {
        try {
            const response = await fetch(`/api/projects/${projectId}/purchased-customers?page=${currentPage}&pageSize=${pageSize}&search=${searchTerm}`)
            if (response.ok) {
                const data = await response.json()
                setPurchasedCustomers(data.data || [])
                setPagination({
                    page: data.pagination?.page || 1,
                    pageSize: data.pagination?.limit || 10,
                    total: data.pagination?.total || 0,
                    totalPages: data.pagination?.totalPages || 0
                })
            }
        } catch (error) {
            console.error('獲取已購客戶列表失敗:', error)
            message.error('獲取數據失敗')
        }
    }

    // 獲取銷售人員列表
    const fetchSalesPersonnel = async () => {
        try {
            const response = await fetch(`/api/projects/${projectId}/sales-personnel`)
            if (response.ok) {
                const data = await response.json()
                console.log('獲取到的銷售人員列表:', data) // 添加调试日志
                setSalesPersonnel(data || [])
            }
        } catch (error) {
            console.error('獲取銷售人員列表失敗:', error)
        }
    }

    useEffect(() => {
        fetchPurchasedCustomers()
        fetchSalesPersonnel() // 添加获取销售人员列表
    }, [currentPage, pageSize, searchTerm, projectId])

    const handleAdd = () => {
        setEditingItem(null)
        form.resetFields()
        // 设置默认值
        form.setFieldsValue({
            rating: 'C',
            isCorporate: false
        })
        setIsModalVisible(true)
    }

    const handleEdit = (item: PurchasedCustomerItem) => {
        console.log('編輯客戶數據:', item) // 添加调试日志
        console.log('銷售人員ID:', item.salesPersonId) // 添加调试日志
        
        setEditingItem(item)
        const formValues = {
            customerName: item.customerName,
            houseNo: item.houseNo,
            purchaseDate: item.purchaseDate ? dayjs(item.purchaseDate) : null,
            idCard: item.idCard || '',
            isCorporate: item.isCorporate || false,
            email: item.email || '',
            phone: item.phone || '',
            age: item.age || null,
            occupation: item.occupation || '',
            registeredAddress: item.registeredAddress || '',
            mailingAddress: item.mailingAddress || '',
            remark: item.remark || '',
            rating: item.rating || 'C',
            salesPersonId: item.salesPersonId || ''
        }
        
        console.log('設置表單值:', formValues) // 添加调试日志
        form.setFieldsValue(formValues)
        setIsModalVisible(true)
    }

    const handleColumnVisibilityChange = (columnKey: string, visible: boolean) => {
        setVisibleColumns(prev => ({
            ...prev,
            [columnKey]: visible
        }))
    }

    const handleDelete = async (id: number) => {
        try {
            const response = await fetch(`/api/projects/${projectId}/purchased-customers/${id}`, {
                method: 'DELETE'
            })
            
            if (response.ok) {
                message.success('刪除成功')
                fetchPurchasedCustomers()
            } else {
                const error = await response.json()
                message.error(error.error || '刪除失敗')
            }
        } catch (error) {
            console.error('刪除失敗:', error)
            message.error('刪除失敗')
        }
    }

    const handleImport = (data: any[]) => {
        // 處理導入邏輯
        console.log('導入數據:', data)
        message.success(`成功導入 ${data.length} 條記錄`)
        fetchPurchasedCustomers()
    }

    const handleExport = () => {
        // 處理導出邏輯
        console.log('導出數據')
        message.success('導出成功')
    }

    const handleSubmit = async (values: CustomerFormData) => {
        try {
            const customerData = {
                customerName: values.customerName,
                houseNo: values.houseNo,
                purchaseDate: values.purchaseDate ? values.purchaseDate.toISOString() : null,
                idCard: values.idCard || null,
                isCorporate: values.isCorporate,
                email: values.email || null,
                phone: values.phone || null,
                age: values.age || null,
                occupation: values.occupation || null,
                registeredAddress: values.registeredAddress || null,
                mailingAddress: values.mailingAddress || null,
                remark: values.remark || null,
                rating: values.rating,
                salesPersonId: values.salesPersonId || null
            }

            if (editingItem) {
                // 更新客戶
                const response = await fetch(`/api/projects/${projectId}/purchased-customers/${editingItem.id}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(customerData)
                })

                if (!response.ok) {
                    throw new Error('更新客戶失敗')
                }

                message.success('更新成功')
            } else {
                // 新增客戶
                const response = await fetch(`/api/projects/${projectId}/purchased-customers`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(customerData)
                })

                if (!response.ok) {
                    throw new Error('新增客戶失敗')
                }

                message.success('新增成功')
            }

            setIsModalVisible(false)
            setEditingItem(null)
            form.resetFields()
            fetchPurchasedCustomers() // 重新獲取數據
        } catch (error) {
            console.error('操作失敗:', error)
            message.error('操作失敗')
        }
    }



    const allColumns = useMemo(() => [
        {
            title: '客戶姓名',
            dataIndex: 'customerName',
            key: 'customerName',
            width: 120,
            fixed: 'left' as const,
        },
        {
            title: '房號',
            dataIndex: 'houseNo',
            key: 'houseNo',
            width: 100,
        },
        {
            title: '購買日期',
            dataIndex: 'purchaseDate',
            key: 'purchaseDate',
            width: 120,
            sorter: (a: PurchasedCustomerItem, b: PurchasedCustomerItem) => {
                if (!a.purchaseDate || !b.purchaseDate) return 0
                return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
            },
            render: (date: string | Date | null) => {
                if (!date) return '-'
                return dayjs(date).format('YYYY/MM/DD')
            },
        },
        {
            title: '聯絡電話',
            dataIndex: 'phone',
            key: 'phone',
            width: 130,
        },
        {
            title: '電子郵件',
            dataIndex: 'email',
            key: 'email',
            width: 150,
            ellipsis: true,
        },
        {
            title: '客戶類型',
            dataIndex: 'isCorporate',
            key: 'isCorporate',
            width: 100,
            render: (isCorporate: boolean) => (
                <Tag color={isCorporate ? 'blue' : 'green'}>
                    {isCorporate ? '企業客戶' : '個人客戶'}
                </Tag>
            ),
        },
        {
            title: '客戶評級',
            dataIndex: 'rating',
            key: 'rating',
            width: 80,
            render: (rating: string) => {
                const colorMap: Record<string, string> = {
                    'S': 'purple',
                    'A': 'gold',
                    'B': 'green',
                    'C': 'blue',
                    'D': 'orange',
                }
                return <Tag color={colorMap[rating] || 'default'}>{rating || '-'}</Tag>
            },
            filters: [
                {text: 'S級', value: 'S'},
                {text: 'A級', value: 'A'},
                {text: 'B級', value: 'B'},
                {text: 'C級', value: 'C'},
                {text: 'D級', value: 'D'},
            ],
            onFilter: (value: any, record: PurchasedCustomerItem) => record.rating === value,
        },
        {
            title: '負責業務',
            dataIndex: 'salesPerson',
            key: 'salesPerson',
            width: 100,
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            fixed: 'right' as const,
            render: (record: PurchasedCustomerItem) => (
                <Space size="small">
                    <Button
                        type="link"
                        icon={<EyeOutlined/>}
                        onClick={() => {
                            setViewingItem(record)
                            setIsDetailDrawerVisible(true)
                        }}
                    >
                        查看
                    </Button>
                    <Button
                        type="link"
                        icon={<EditOutlined/>}
                        onClick={() => handleEdit(record)}
                    >
                        編輯
                    </Button>
                    <Popconfirm
                        title="確定要刪除這個客戶嗎？"
                        onConfirm={() => handleDelete(record.id)}
                        okText="確定"
                        cancelText="取消"
                    >
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined/>}
                        >
                            刪除
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ], [])

    // 根據visibleColumns過濾顯示的欄位
    const columns = allColumns.filter(column => {
        if (column.key === 'action') return true // 操作欄位始終顯示
        return visibleColumns[column.key as string] !== false
    })

    const handleViewDetail = (item: PurchasedCustomerItem) => {
        setViewingItem(item)
        setIsDetailDrawerVisible(true)
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">已購客名單</h1>
                    <p className="text-gray-600 mt-1">管理已購買房屋的客戶信息</p>
                </div>
                <div className="flex space-x-3">
                    <Button type="primary" icon={<PlusOutlined/>} onClick={handleAdd}>
                        新增客戶
                    </Button>
                    <ImportExportActions data={purchasedCustomers} projectId={projectId}/>
                    <ColumnVisibilityControl
                        visibleColumns={visibleColumns}
                        onColumnVisibilityChange={handleColumnVisibilityChange}
                    />
                </div>
            </div>

            {/* 搜索和篩選區域 */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <div className="flex items-center space-x-4 mb-4">
                    <div>
                        <Input
                            placeholder="搜索客戶姓名、房號、電話..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            allowClear
                        />
                    </div>
                </div>
            </div>

            <Card>
                <Table
                    columns={columns}
                    dataSource={purchasedCustomers}
                    rowKey="id"
                    scroll={{x: 1200, y: 600}}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 項，共 ${total} 項`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        onChange: (page, size) => {
                            setCurrentPage(page)
                            setPageSize(size || 10)
                        },
                        onShowSizeChange: (current, size) => {
                            setCurrentPage(1)
                            setPageSize(size)
                        }
                    }}
                />
            </Card>

            <Modal
                title={editingItem ? '編輯客戶' : '新增客戶'}
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false)
                    setEditingItem(null)
                    form.resetFields()
                }}
                footer={null}
                width={700}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        rating: 'C',
                        isCorporate: false
                    }}
                    size="small"
                >
                    {/* 基本信息 - 第一行 */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <Form.Item
                            name="customerName"
                            label="客戶姓名"
                            rules={[{required: true, message: '請輸入客戶姓名'}]}
                        >
                            <Input placeholder="請輸入客戶姓名"/>
                        </Form.Item>

                        <Form.Item
                            name="houseNo"
                            label="房號"
                            rules={[{required: true, message: '請輸入房號'}]}
                        >
                            <Input placeholder="請輸入房號"/>
                        </Form.Item>
                    </div>

                    {/* 基本信息 - 第二行 */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <Form.Item
                            name="purchaseDate"
                            label="購買日期"
                        >
                            <DatePicker className="w-full"/>
                        </Form.Item>

                        <Form.Item
                            name="idCard"
                            label="身份證號"
                        >
                            <Input placeholder="請輸入身份證號"/>
                        </Form.Item>
                    </div>

                    {/* 联系信息 - 第三行 */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <Form.Item
                            name="phone"
                            label="聯絡電話"
                        >
                            <Input placeholder="請輸入聯絡電話"/>
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label="電子郵件"
                        >
                            <Input placeholder="請輸入電子郵件"/>
                        </Form.Item>
                    </div>

                    {/* 客户信息 - 第四行 */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        <Form.Item
                            name="isCorporate"
                            label="客戶類型"
                            valuePropName="checked"
                        >
                            <Select placeholder="請選擇客戶類型">
                                <Option value={false}>個人客戶</Option>
                                <Option value={true}>企業客戶</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="age"
                            label="年齡"
                        >
                            <InputNumber className="w-full" placeholder="年齡" min={0} max={150}/>
                        </Form.Item>

                        <Form.Item
                            name="rating"
                            label="客戶評級"
                            rules={[{required: true, message: '請選擇客戶評級'}]}
                        >
                            <Select placeholder="請選擇客戶評級">
                                <Option value="S">S級</Option>
                                <Option value="A">A級</Option>
                                <Option value="B">B級</Option>
                                <Option value="C">C級</Option>
                                <Option value="D">D級</Option>
                            </Select>
                        </Form.Item>
                    </div>

                    {/* 职业信息 - 第五行 */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <Form.Item
                            name="occupation"
                            label="職業"
                        >
                            <Input placeholder="請輸入職業"/>
                        </Form.Item>

                        <Form.Item
                            name="salesPersonId"
                            label="銷售人員"
                        >
                            <Select
                                placeholder="請選擇銷售人員"
                                className="w-full"
                                showSearch
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {salesPersonnel.map(person => (
                                    <Option key={person.employee_no} value={person.employee_no}>
                                        {person.name} ({person.employee_no})
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>

                    {/* 地址信息 - 第六行 */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <Form.Item
                            name="registeredAddress"
                            label="戶籍地址"
                        >
                            <TextArea rows={2} placeholder="請輸入戶籍地址"/>
                        </Form.Item>

                        <Form.Item
                            name="mailingAddress"
                            label="通訊地址"
                        >
                            <TextArea rows={2} placeholder="請輸入通訊地址"/>
                        </Form.Item>
                    </div>

                    {/* 备注信息 - 第七行 */}
                    <Form.Item
                        name="remark"
                        label="備註"
                        className="mb-3"
                    >
                        <TextArea rows={2} placeholder="請輸入備註"/>
                    </Form.Item>

                    {/* 操作按钮 */}
                    <div className="flex justify-end space-x-2 pt-2 border-t">
                        <Button onClick={() => {
                            setIsModalVisible(false)
                            setEditingItem(null)
                            form.resetFields()
                        }}>
                            取消
                        </Button>
                        <Button type="primary" htmlType="submit">
                            {editingItem ? '更新' : '新增'}
                        </Button>
                    </div>
                </Form>
            </Modal>

            <Drawer
                title="客戶詳細資訊"
                placement="right"
                onClose={() => setIsDetailDrawerVisible(false)}
                open={isDetailDrawerVisible}
                width={600}
            >
                {viewingItem && (
                    <div>
                        <Card title="基本資訊" style={{marginBottom: 16}}>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                                <div>
                                    <strong>客戶姓名：</strong>{viewingItem.customerName}
                                </div>
                                <div>
                                    <strong>聯絡電話：</strong>{viewingItem.phone || '未設定'}
                                </div>
                                <div>
                                    <strong>電子郵件：</strong>{viewingItem.email || '未設定'}
                                </div>
                                <div>
                                    <strong>房號：</strong>{viewingItem.houseNo}
                                </div>
                                <div>
                                    <strong>購買日期：</strong>{viewingItem.purchaseDate ? new Date(viewingItem.purchaseDate).toLocaleDateString() : '未設定'}
                                </div>
                                <div>
                                    <strong>客戶評級：</strong>
                                    <Tag color={
                                        viewingItem.rating === 'S' ? 'purple' :
                                        viewingItem.rating === 'A' ? 'green' :
                                        viewingItem.rating === 'B' ? 'blue' :
                                        viewingItem.rating === 'C' ? 'orange' : 'red'
                                    } style={{marginLeft: 8}}>
                                        {viewingItem.rating}級
                                    </Tag>
                                </div>
                                <div>
                                    <strong>身份證號：</strong>{viewingItem.idCard || '未設定'}
                                </div>
                                <div>
                                    <strong>是否企業客戶：</strong>{viewingItem.isCorporate ? '是' : '否'}
                                </div>
                                <div>
                                    <strong>年齡：</strong>{viewingItem.age || '未設定'}
                                </div>
                                <div>
                                    <strong>職業：</strong>{viewingItem.occupation || '未設定'}
                                </div>
                                <div>
                                    <strong>負責業務：</strong>{viewingItem.salesPerson || '未設定'}
                                </div>
                            </div>
                        </Card>

                        <Card title="地址資訊" style={{marginBottom: 16}}>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '16px'}}>
                                {viewingItem.registeredAddress && (
                                    <div>
                                        <strong>戶籍地址：</strong>{viewingItem.registeredAddress}
                                    </div>
                                )}
                                {viewingItem.mailingAddress && (
                                    <div>
                                        <strong>通訊地址：</strong>{viewingItem.mailingAddress}
                                    </div>
                                )}
                            </div>
                        </Card>

                        {viewingItem.remark && (
                            <Card title="備註資訊" style={{marginBottom: 16}}>
                                <div>
                                    <strong>備註：</strong>{viewingItem.remark}
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </Drawer>
        </div>
    )
}