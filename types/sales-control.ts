export interface SalesControlData {
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