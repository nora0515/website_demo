const SCRIPT_SRC = 'https://cdn.iamport.kr/v1/iamport.js'

export const impCode = import.meta.env.VITE_IMP_CODE || ''
export const pgProvider = import.meta.env.VITE_IMP_PG || 'html5_inicis.INIpayTest'
export const isConfigured = Boolean(impCode)

let pending

// Loads the gateway script once, on the first checkout rather than on every
// page, and initialises it with the merchant code.
function loadImp() {
  if (window.IMP) return Promise.resolve(window.IMP)
  pending ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve(window.IMP)
    script.onerror = () => {
      // Let a later attempt retry instead of caching the failure forever.
      pending = undefined
      reject(new Error('결제 모듈을 불러오지 못했습니다.'))
    }
    document.head.appendChild(script)
  })
  return pending
}

// Opens the payment window and resolves with the gateway's imp_uid, which the
// server then verifies. A failure here means no money moved.
export async function requestPayment({ orderNumber, amount, name, buyer }) {
  const IMP = await loadImp()
  IMP.init(impCode)
  return new Promise((resolve, reject) => {
    IMP.request_pay(
      {
        pg: pgProvider,
        pay_method: 'card',
        merchant_uid: orderNumber,
        name,
        amount,
        buyer_name: buyer?.name,
        buyer_tel: buyer?.phone_number,
      },
      (response) => {
        if (response.success) resolve(response.imp_uid)
        else reject(new Error(response.error_msg || '결제가 취소되었습니다.'))
      },
    )
  })
}
