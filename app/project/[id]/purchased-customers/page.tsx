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
    contactPhone: string
    email?: string
    contractNumber: string
    houseNo: string
    houseType: string
    purchaseDate: Date | string
    totalAmount: number
    paidAmount: number
    remainingAmount: number
    paymentStatus: 'PENDING' | 'PARTIAL' | 'COMPLETED'
    loanStatus: 'NOT_APPLIED' | 'APPLIED' | 'APPROVED' | 'REJECTED'
    contractStatus: 'PENDING' | 'SIGNED' | 'CANCELLED'
    handoverStatus: 'PENDING' | 'SCHEDULED' | 'COMPLETED'
    handoverDate?: Date | string | null
    salesPersonId?: number
    salesPerson?: string
    rating: 'A' | 'B' | 'C' | 'D'
    remark?: string
    mailingAddress?: string
    createdAt: Date | string
    updatedAt: Date | string
    lastContactDate?: Date | string | null
    nextFollowUpDate?: Date | string | null
}

interface CustomerFormData {
    customerName: string
    contactPhone: string
    email: string
    houseNo: string
    houseType: string
    purchaseDate: dayjs.Dayjs
    totalAmount: number
    paidAmount: number
    paymentStatus: 'COMPLETED' | 'PARTIAL' | 'PENDING'
    contractStatus: 'SIGNED' | 'PENDING' | 'CANCELLED'
    handoverStatus: 'COMPLETED' | 'SCHEDULED' | 'PENDING'
    handoverDate: dayjs.Dayjs | null
    salesPerson: string
    remark: string
    lastContactDate: dayjs.Dayjs | null
    nextFollowUpDate: dayjs.Dayjs | null
}

export default function PurchasedCustomersPage() {
    const { message } = App.useApp()
    const params = useParams()
    const projectId = params.id as string
    const [purchasedCustomers, setPurchasedCustomers] = useState<PurchasedCustomerItem[]>([])
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterPaymentStatus, setFilterPaymentStatus] = useState('')
    const [filterLoanStatus, setFilterLoanStatus] = useState('')
    const [filterRating, setFilterRating] = useState('')
    const [loading, setLoading] = useState(false)
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
        customerName: true,
        contactPhone: true,
        houseNo: true,
        houseType: true,
        purchaseDate: true,
        totalAmount: true,
        paymentProgress: true,
        paymentStatus: true,
        contractStatus: true,
        handoverStatus: true,
        salesPerson: true,
        contractNumber: false,
        loanStatus: false,
        rating: false,
        mailingAddress: false,
        lastContactDate: false,
        nextFollowUpDate: false,
    })
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false)
    const [editingItem, setEditingItem] = useState<PurchasedCustomerItem | null>(null)
    const [viewingItem, setViewingItem] = useState<PurchasedCustomerItem | null>(null)
    const [form] = Form.useForm()

    // API 數據獲取
    const fetchPurchasedCustomers = async () => {
        try {
            setLoading(true)
            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                pageSize: pageSize.toString(),
                ...(searchTerm && {searchTerm}),
                ...(filterPaymentStatus && {paymentStatus: filterPaymentStatus}),
                ...(filterLoanStatus && {loanStatus: filterLoanStatus}),
                ...(filterRating && {rating: filterRating})
            })

            const response = await fetch(`/api/projects/${projectId}/purchased-customers?${queryParams}`)
            if (!response.ok) {
                throw new Error('獲取已購客戶數據失敗')
            }

            const data = await response.json()
            setPurchasedCustomers(data.data || [])
            setPagination(data.pagination || {page: 1, pageSize: 10, total: 0, totalPages: 0})
        } catch (error) {
            console.error('獲取已購客戶數據失敗:', error)
            message.error('獲取已購客戶數據失敗')
        } finally {
            setLoading(false)
        }
    }

    const houseTypes = [
        '1房1廳1衛',
        '2房1廳1衛',
        '2房2廳1衛',
        '3房2廳2衛',
        '4房2廳3衛',
        '其他'
    ]

    const salesPersons = [
        '張業務',
        '陳業務',
        '林業務',
        '王業務',
        '劉業務',
        '黃業務'
    ]

    useEffect(() => {
        fetchPurchasedCustomers()
    }, [projectId, currentPage, pageSize, searchTerm, filterPaymentStatus, filterLoanStatus, filterRating])

    const handleAdd = () => {
        setEditingItem(null)
        form.resetFields()
        // 设置默认值
        form.setFieldsValue({
            paymentStatus: 'PENDING',
            contractStatus: 'PENDING',
            handoverStatus: 'PENDING'
        })
        setIsModalVisible(true)
    }

    const handleEdit = (item: PurchasedCustomerItem) => {
        setEditingItem(item)
        form.setFieldsValue({
            ...item,
            purchaseDate: item.purchaseDate ? dayjs(item.purchaseDate) : null,
            handoverDate: item.handoverDate ? dayjs(item.handoverDate) : null,
            lastContactDate: item.lastContactDate ? dayjs(item.lastContactDate) : null,
            nextFollowUpDate: item.nextFollowUpDate ? dayjs(item.nextFollowUpDate) : null
        })
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
            // 这里应该调用API删除数据
            setPurchasedCustomers(prev => prev.filter(item => item.id !== id))
            message.success('刪除成功')
        } catch (error) {
            message.error('刪除失敗')
        }
    }

    const handleSubmit = async (values: any) => {
        try {
            const customerData = {
                name: values.customerName,
                contactPhone: values.contactPhone,
                email: values.email,
                contractNo: values.contractNumber,
                houseNo: values.houseNo,
                houseType: values.houseType,
                purchaseDate: values.purchaseDate ? values.purchaseDate.toISOString() : null,
                totalPrice: values.totalAmount,
                paidAmount: values.paidAmount,
                paymentStatus: values.paymentStatus,
                loanStatus: values.loanStatus,
                contractStatus: values.contractStatus,
                handoverStatus: values.handoverStatus,
                handoverDate: values.handoverDate ? values.handoverDate.toISOString() : null,
                salesPersonId: values.salesPersonId,
                rating: values.rating,
                remark: values.remark,
                mailingAddress: values.mailingAddress,
                lastContactDate: values.lastContactDate ? values.lastContactDate.toISOString() : null,
                nextFollowUpDate: values.nextFollowUpDate ? values.nextFollowUpDate.toISOString() : null
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

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'green'
            case 'PARTIAL':
                return 'orange'
            case 'PENDING':
                return 'red'
            default:
                return 'default'
        }
    }

    const getPaymentStatusText = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return '已完成'
            case 'PARTIAL':
                return '部分付款'
            case 'PENDING':
                return '待付款'
            default:
                return status
        }
    }

    const getContractStatusColor = (status: string) => {
        switch (status) {
            case 'SIGNED':
                return 'green'
            case 'PENDING':
                return 'orange'
            case 'CANCELLED':
                return 'red'
            default:
                return 'default'
        }
    }

    const getContractStatusText = (status: string) => {
        switch (status) {
            case 'SIGNED':
                return '已簽約'
            case 'PENDING':
                return '待簽約'
            case 'CANCELLED':
                return '已取消'
            default:
                return status
        }
    }

    const getHandoverStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'green'
            case 'SCHEDULED':
                return 'blue'
            case 'PENDING':
                return 'orange'
            default:
                return 'default'
        }
    }

    const getHandoverStatusText = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return '已交屋'
            case 'SCHEDULED':
                return '已安排'
            case 'PENDING':
                return '待安排'
            default:
                return status
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
            title: '聯絡電話',
            dataIndex: 'contactPhone',
            key: 'contactPhone',
            width: 130,
        },
        {
            title: '房號',
            dataIndex: 'houseNo',
            key: 'houseNo',
            width: 100,
        },
        {
            title: '房型',
            dataIndex: 'houseType',
            key: 'houseType',
            width: 120,
        },
        {
            title: '購買日期',
            dataIndex: 'purchaseDate',
            key: 'purchaseDate',
            width: 120,
            sorter: (a: PurchasedCustomerItem, b: PurchasedCustomerItem) =>
                new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime(),
            render: (date: string | Date) => {
                if (!date) return '-'
                return dayjs(date).format('YYYY/MM/DD')
            },
        },
        {
            title: '總金額',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: 120,
            render: (amount: number) => formatCurrency(amount),
            sorter: (a: PurchasedCustomerItem, b: PurchasedCustomerItem) => a.totalAmount - b.totalAmount,
        },
        {
            title: '付款進度',
            key: 'paymentProgress',
            width: 150,
            render: (record: PurchasedCustomerItem) => {
                const percent = Math.round((record.paidAmount / record.totalAmount) * 100)
                return (
                    <Progress
                        percent={percent}
                        size="small"
                        status={percent === 100 ? 'success' : 'active'}
                        format={() => `${percent}%`}
                    />
                )
            },
        },
        {
            title: '付款狀態',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            width: 100,
            render: (status: string) => (
                <Tag color={getPaymentStatusColor(status)}>
                    {getPaymentStatusText(status)}
                </Tag>
            ),
            filters: [
                {text: '已完成', value: 'COMPLETED'},
                {text: '部分付款', value: 'PARTIAL'},
                {text: '待付款', value: 'PENDING'},
            ],
            onFilter: (value: any, record: PurchasedCustomerItem) => record.paymentStatus === value,
        },
        {
            title: '合約狀態',
            dataIndex: 'contractStatus',
            key: 'contractStatus',
            width: 100,
            render: (status: string) => (
                <Tag color={getContractStatusColor(status)}>
                    {getContractStatusText(status)}
                </Tag>
            ),
            filters: [
                {text: '已簽約', value: 'SIGNED'},
                {text: '待簽約', value: 'PENDING'},
                {text: '已取消', value: 'CANCELLED'},
            ],
            onFilter: (value: any, record: PurchasedCustomerItem) => record.contractStatus === value,
        },
        {
            title: '交屋狀態',
            dataIndex: 'handoverStatus',
            key: 'handoverStatus',
            width: 100,
            render: (status: string) => (
                <Tag color={getHandoverStatusColor(status)}>
                    {getHandoverStatusText(status)}
                </Tag>
            ),
            filters: [
                {text: '已交屋', value: 'COMPLETED'},
                {text: '已安排', value: 'SCHEDULED'},
                {text: '待安排', value: 'PENDING'},
            ],
            onFilter: (value: any, record: PurchasedCustomerItem) => record.handoverStatus === value,
        },
        {
            title: '負責業務',
            dataIndex: 'salesPerson',
            key: 'salesPerson',
            width: 100,
        },
        {
            title: '合約編號',
            dataIndex: 'contractNumber',
            key: 'contractNumber',
            width: 120,
        },
        {
            title: '貸款狀態',
            dataIndex: 'loanStatus',
            key: 'loanStatus',
            width: 100,
            render: (status: string) => {
                const colorMap: Record<string, string> = {
                    'NOT_APPLIED': 'default',
                    'APPLIED': 'processing',
                    'APPROVED': 'success',
                    'REJECTED': 'error',
                }
                const textMap: Record<string, string> = {
                    'NOT_APPLIED': '未申請',
                    'APPLIED': '已申請',
                    'APPROVED': '已核准',
                    'REJECTED': '已拒絕',
                }
                return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status || '-'}</Tag>
            },
            filters: [
                {text: '未申請', value: 'NOT_APPLIED'},
                {text: '已申請', value: 'APPLIED'},
                {text: '已核准', value: 'APPROVED'},
                {text: '已拒絕', value: 'REJECTED'},
            ],
            onFilter: (value: any, record: PurchasedCustomerItem) => record.loanStatus === value,
        },
        {
            title: '客戶評級',
            dataIndex: 'rating',
            key: 'rating',
            width: 80,
            render: (rating: string) => {
                const colorMap: Record<string, string> = {
                    'A': 'gold',
                    'B': 'green',
                    'C': 'blue',
                    'D': 'orange',
                }
                return <Tag color={colorMap[rating] || 'default'}>{rating || '-'}</Tag>
            },
            filters: [
                {text: 'A級', value: 'A'},
                {text: 'B級', value: 'B'},
                {text: 'C級', value: 'C'},
                {text: 'D級', value: 'D'},
            ],
            onFilter: (value: any, record: PurchasedCustomerItem) => record.rating === value,
        },
        {
            title: '郵寄地址',
            dataIndex: 'mailingAddress',
            key: 'mailingAddress',
            width: 200,
            ellipsis: true,
        },
        {
            title: '最後聯絡日期',
            dataIndex: 'lastContactDate',
            key: 'lastContactDate',
            width: 120,
            render: (date: string | Date) => {
                if (!date) return '-'
                return dayjs(date).format('YYYY/MM/DD')
            },
        },
        {
            title: '下次跟進日期',
            dataIndex: 'nextFollowUpDate',
            key: 'nextFollowUpDate',
            width: 120,
            render: (date: string | Date) => {
                if (!date) return '-'
                return dayjs(date).format('YYYY/MM/DD')
            },
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
                        詳情
                    </Button>
                    <Button
                        type="link"
                        icon={<EditOutlined/>}
                        onClick={() => handleEdit(record)}
                    >
                        編輯
                    </Button>
                    <Popconfirm
                        title="確定要刪除這筆記錄嗎？"
                        onConfirm={() => handleDelete(record.id)}
                        okText="確定"
                        cancelText="取消"
                    >
                        <Button type="link" danger icon={<DeleteOutlined/>}>
                            刪除
                        </Button>
                    </Popconfirm>
                    <Button
                        type="link"
                        icon={<PhoneOutlined/>}
                        onClick={() => window.open(`tel:${record.contactPhone}`)}
                    >
                        撥號
                    </Button>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">搜索</label>
                        <Input
                            placeholder="搜索客戶姓名、電話、房號..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            allowClear
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">付款狀態</label>
                        <Select
                            placeholder="選擇付款狀態"
                            value={filterPaymentStatus}
                            onChange={setFilterPaymentStatus}
                            allowClear
                            className="w-full"
                        >
                            <Option value="PENDING">待付款</Option>
                            <Option value="PARTIAL">部分付款</Option>
                            <Option value="COMPLETED">已付清</Option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">貸款狀態</label>
                        <Select
                            placeholder="選擇貸款狀態"
                            value={filterLoanStatus}
                            onChange={setFilterLoanStatus}
                            allowClear
                            className="w-full"
                        >
                            <Option value="NOT_APPLIED">未申請</Option>
                            <Option value="APPLIED">已申請</Option>
                            <Option value="APPROVED">已核准</Option>
                            <Option value="REJECTED">已拒絕</Option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">客戶評級</label>
                        <Select
                            placeholder="選擇客戶評級"
                            value={filterRating}
                            onChange={setFilterRating}
                            allowClear
                            className="w-full"
                        >
                            <Option value="A">A級</Option>
                            <Option value="B">B級</Option>
                            <Option value="C">C級</Option>
                            <Option value="D">D級</Option>
                        </Select>
                    </div>
                </div>
            </div>

            <Card>
                <Table
                    columns={columns}
                    dataSource={purchasedCustomers}
                    rowKey="id"
                    scroll={{x: 1500, y: 600}}
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
                width={800}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="customerName"
                            label="客戶姓名"
                            rules={[{required: true, message: '請輸入客戶姓名'}]}
                        >
                            <Input placeholder="請輸入客戶姓名"/>
                        </Form.Item>

                        <Form.Item
                            name="contactPhone"
                            label="聯絡電話"
                            rules={[{required: true, message: '請輸入聯絡電話'}]}
                        >
                            <Input placeholder="請輸入聯絡電話"/>
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="email"
                            label="電子郵件"
                            rules={[{type: 'email', message: '請輸入有效的電子郵件'}]}
                        >
                            <Input placeholder="請輸入電子郵件"/>
                        </Form.Item>

                        <Form.Item
                            name="contractNumber"
                            label="合約編號"
                            rules={[{required: true, message: '請輸入合約編號'}]}
                        >
                            <Input placeholder="請輸入合約編號"/>
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="houseNo"
                            label="房屋編號"
                            rules={[{required: true, message: '請輸入房屋編號'}]}
                        >
                            <Input placeholder="請輸入房屋編號"/>
                        </Form.Item>

                        <Form.Item
                            name="houseType"
                            label="房屋類型"
                            rules={[{required: true, message: '請選擇房屋類型'}]}
                        >
                            <Select placeholder="請選擇房屋類型">
                                {houseTypes.map(type => (
                                    <Option key={type} value={type}>{type}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="purchaseDate"
                            label="購買日期"
                            rules={[{required: true, message: '請選擇購買日期'}]}
                        >
                            <DatePicker className="w-full"/>
                        </Form.Item>

                        <Form.Item
                            name="totalAmount"
                            label="總金額"
                            rules={[{required: true, message: '請輸入總金額'}]}
                        >
                            <InputNumber
                                className="w-full"
                                placeholder="請輸入總金額"
                                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                            />
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="paidAmount"
                            label="已付金額"
                            rules={[{required: true, message: '請輸入已付金額'}]}
                        >
                            <InputNumber
                                className="w-full"
                                placeholder="請輸入已付金額"
                                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                            />
                        </Form.Item>

                        <Form.Item
                            name="paymentStatus"
                            label="付款狀態"
                            rules={[{required: true, message: '請選擇付款狀態'}]}
                        >
                            <Select placeholder="請選擇付款狀態">
                                <Option value="PENDING">待付款</Option>
                                <Option value="PARTIAL">部分付款</Option>
                                <Option value="COMPLETED">已付清</Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="loanStatus"
                            label="貸款狀態"
                            rules={[{required: true, message: '請選擇貸款狀態'}]}
                        >
                            <Select placeholder="請選擇貸款狀態">
                                <Option value="NOT_APPLIED">未申請</Option>
                                <Option value="APPLIED">已申請</Option>
                                <Option value="APPROVED">已核准</Option>
                                <Option value="REJECTED">已拒絕</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="rating"
                            label="客戶評級"
                            rules={[{required: true, message: '請選擇客戶評級'}]}
                        >
                            <Select placeholder="請選擇客戶評級">
                                <Option value="A">A級</Option>
                                <Option value="B">B級</Option>
                                <Option value="C">C級</Option>
                                <Option value="D">D級</Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="contractStatus"
                            label="合約狀態"
                            rules={[{required: true, message: '請選擇合約狀態'}]}
                        >
                            <Select placeholder="請選擇合約狀態">
                                <Option value="PENDING">待簽約</Option>
                                <Option value="SIGNED">已簽約</Option>
                                <Option value="CANCELLED">已取消</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="handoverStatus"
                            label="交房狀態"
                            rules={[{required: true, message: '請選擇交房狀態'}]}
                        >
                            <Select placeholder="請選擇交房狀態">
                                <Option value="PENDING">未交房</Option>
                                <Option value="SCHEDULED">已排程</Option>
                                <Option value="COMPLETED">已交房</Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="handoverDate"
                        label="交房日期"
                    >
                        <DatePicker className="w-full"/>
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="salesPersonId"
                            label="銷售人員ID"
                        >
                            <InputNumber className="w-full" placeholder="請輸入銷售人員ID"/>
                        </Form.Item>

                        <Form.Item
                            name="mailingAddress"
                            label="郵寄地址"
                        >
                            <Input placeholder="請輸入郵寄地址"/>
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="lastContactDate"
                            label="最後聯絡日期"
                        >
                            <DatePicker className="w-full"/>
                        </Form.Item>

                        <Form.Item
                            name="nextFollowUpDate"
                            label="下次跟進日期"
                        >
                            <DatePicker className="w-full"/>
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="remark"
                        label="備註"
                    >
                        <TextArea rows={3} placeholder="請輸入備註"/>
                    </Form.Item>

                    <div className="flex justify-end space-x-2 pt-4">
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
                                    <strong>聯絡電話：</strong>{viewingItem.contactPhone}
                                </div>
                                <div>
                                    <strong>電子郵件：</strong>{viewingItem.email}
                                </div>
                                <div>
                                    <strong>合約編號：</strong>{viewingItem.contractNumber}
                                </div>
                                <div>
                                    <strong>房號：</strong>{viewingItem.houseNo}
                                </div>
                                <div>
                                    <strong>房型：</strong>{viewingItem.houseType}
                                </div>
                                <div>
                                    <strong>購買日期：</strong>{viewingItem.purchaseDate}
                                </div>
                                <div>
                                    <strong>客戶評級：</strong>
                                    <Tag color={
                                        viewingItem.rating === 'A' ? 'green' :
                                            viewingItem.rating === 'B' ? 'blue' :
                                                viewingItem.rating === 'C' ? 'orange' : 'red'
                                    } style={{marginLeft: 8}}>
                                        {viewingItem.rating}級
                                    </Tag>
                                </div>
                                {viewingItem.mailingAddress && (
                                    <div>
                                        <strong>郵寄地址：</strong>{viewingItem.mailingAddress}
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card title="付款資訊" style={{marginBottom: 16}}>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                                <div>
                                    <strong>總金額：</strong>{formatCurrency(viewingItem.totalAmount)}
                                </div>
                                <div>
                                    <strong>已付金額：</strong>{formatCurrency(viewingItem.paidAmount)}
                                </div>
                                <div>
                                    <strong>剩餘金額：</strong>{formatCurrency(viewingItem.remainingAmount)}
                                </div>
                                <div>
                                    <strong>付款狀態：</strong>
                                    <Tag color={getPaymentStatusColor(viewingItem.paymentStatus)}
                                         style={{marginLeft: 8}}>
                                        {getPaymentStatusText(viewingItem.paymentStatus)}
                                    </Tag>
                                </div>
                                <div>
                                    <strong>貸款狀態：</strong>
                                    <Tag color={
                                        viewingItem.loanStatus === 'APPROVED' ? 'green' :
                                            viewingItem.loanStatus === 'APPLIED' ? 'blue' :
                                                viewingItem.loanStatus === 'REJECTED' ? 'red' : 'default'
                                    } style={{marginLeft: 8}}>
                                        {viewingItem.loanStatus === 'APPROVED' ? '已核准' :
                                            viewingItem.loanStatus === 'APPLIED' ? '已申請' :
                                                viewingItem.loanStatus === 'REJECTED' ? '已拒絕' : '未申請'}
                                    </Tag>
                                </div>
                            </div>
                            <div style={{marginTop: 16}}>
                                <strong>付款進度：</strong>
                                <Progress
                                    percent={Math.round((viewingItem.paidAmount / viewingItem.totalAmount) * 100)}
                                    status={viewingItem.paidAmount === viewingItem.totalAmount ? 'success' : 'active'}
                                    style={{marginTop: 8}}
                                />
                            </div>
                        </Card>

                        <Card title="狀態資訊" style={{marginBottom: 16}}>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                                <div>
                                    <strong>合約狀態：</strong>
                                    <Tag color={getContractStatusColor(viewingItem.contractStatus)}
                                         style={{marginLeft: 8}}>
                                        {getContractStatusText(viewingItem.contractStatus)}
                                    </Tag>
                                </div>
                                <div>
                                    <strong>交屋狀態：</strong>
                                    <Tag color={getHandoverStatusColor(viewingItem.handoverStatus)}
                                         style={{marginLeft: 8}}>
                                        {getHandoverStatusText(viewingItem.handoverStatus)}
                                    </Tag>
                                </div>
                                <div>
                                    <strong>交屋日期：</strong>{viewingItem.handoverDate || '未安排'}
                                </div>
                                {viewingItem.salesPersonId && (
                                    <div>
                                        <strong>銷售人員ID：</strong>{viewingItem.salesPersonId}
                                    </div>
                                )}
                                <div>
                                    <strong>負責業務：</strong>{viewingItem.salesPerson}
                                </div>
                            </div>
                        </Card>

                        <Card title="追蹤記錄">
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                                <div>
                                    <strong>建立時間：</strong>{viewingItem.createdAt}
                                </div>
                                <div>
                                    <strong>最後聯絡：</strong>{viewingItem.lastContactDate || '無記錄'}
                                </div>
                                <div>
                                    <strong>下次追蹤：</strong>{viewingItem.nextFollowUpDate || '未安排'}
                                </div>
                            </div>
                            {viewingItem.remark && (
                                <div style={{marginTop: 16}}>
                                    <strong>備註：</strong>
                                    <div style={{
                                        marginTop: 8,
                                        padding: 12,
                                        backgroundColor: '#f5f5f5',
                                        borderRadius: 4
                                    }}>
                                        {viewingItem.remark}
                                    </div>
                                </div>
                            )}
                        </Card>

                        <div style={{marginTop: 24, textAlign: 'center'}}>
                            <Space>
                                <Button
                                    type="primary"
                                    icon={<PhoneOutlined/>}
                                    onClick={() => window.open(`tel:${viewingItem.contactPhone}`)}
                                >
                                    撥打電話
                                </Button>
                                <Button
                                    icon={<MessageOutlined/>}
                                    onClick={() => window.open(`sms:${viewingItem.contactPhone}`)}
                                >
                                    發送簡訊
                                </Button>
                                <Button
                                    icon={<EditOutlined/>}
                                    onClick={() => {
                                        setIsDetailDrawerVisible(false)
                                        handleEdit(viewingItem)
                                    }}
                                >
                                    編輯資料
                                </Button>
                            </Space>
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    )
}