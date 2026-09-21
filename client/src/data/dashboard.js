// Orders and revenue have no API yet, so these stand in until one exists.
export const recentOrders = [
  { id: 'ORD-001234', customer: '김민수', date: '2026-09-20', status: '처리중', amount: 219000 },
  { id: 'ORD-001233', customer: '이영희', date: '2026-09-19', status: '배송중', amount: 156000 },
  { id: 'ORD-001232', customer: '박철수', date: '2026-09-18', status: '배송완료', amount: 497000 },
  { id: 'ORD-001231', customer: '정수진', date: '2026-09-18', status: '배송완료', amount: 89000 },
  { id: 'ORD-001230', customer: '최지훈', date: '2026-09-17', status: '취소', amount: 132000 },
]

export const quickActions = [
  { id: 'new-product', label: '새 상품 등록', icon: 'plus', primary: true, href: '/admin/products' },
  { id: 'orders', label: '주문 관리', icon: 'eye' },
  { id: 'sales', label: '매출 분석', icon: 'chart' },
  { id: 'customers', label: '고객 관리', icon: 'users' },
]

export const statusTone = {
  처리중: 'pending',
  배송중: 'shipping',
  배송완료: 'done',
  취소: 'cancelled',
}
