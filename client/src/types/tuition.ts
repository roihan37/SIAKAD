export type BillStatus = "BELUM_DIBAYAR" | "SEBAGIAN" | "LUNAS" | "JATUH_TEMPO"
export interface Bill {
  id: string
  billNumber: string
  student: { id: string; studentId: string; nim: string; name: string; prodi: { id: number; name: string } }
  academicYear: { id: number; year: string; semester: string }
  amount: number
  paidAmount: number
  remainingAmount: number
  dueDate: string
  status: BillStatus
}
export interface BillFilters { tahunAkademikId?: number; prodiId?: number; status?: BillStatus; search: string }
export interface BillQuery extends BillFilters { page: number; limit: number }
export interface BillList {
  summary: { totalBills: number; paid: number; unpaid: number; overdue: number; totalAmount: number; paidAmount: number; outstandingAmount: number }
  bills: Bill[]
  pagination: { page: number; limit: number; totalRows: number; totalPages: number }
}
export interface GenerateBills { tahunAkademikId: number; prodiId: number; angkatan: number; nominal: string; jatuhTempo: string }
export interface BillOptions { years: { id: string; label: string }[]; programs: { id: string; label: string }[] }
