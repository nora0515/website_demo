import { ORDER_LABELS, PAYMENT_LABELS } from '@/api/orders'

export default function OrderStatus({ status, payment }) {
  return (
    <span className="status-pair">
      <span className={`status order-${status}`}>{ORDER_LABELS[status] ?? status}</span>
      <span className={`status pay-${payment}`}>{PAYMENT_LABELS[payment] ?? payment}</span>
    </span>
  )
}
