export type PaymentBank = {
  id: string
  /** ชื่อแสดง / fallback เมื่อยังไม่มีรูป */
  label: string
  /** ใส่รูปที่ public/images/banks/{id}.webp (หรือ .png) */
  logoSrc: string
}

/** ธนาคาร / ช่องทางชำระ — แก้รูปที่ public/images/banks/ */
export const HOME_PAYMENT_BANKS: PaymentBank[] = [
  { id: 'bbl', label: 'กรุงเทพ', logoSrc: '/images/banks/bbl.webp' },
  { id: 'ktb', label: 'กรุงไทย', logoSrc: '/images/banks/ktb.webp' },
  { id: 'kbank', label: 'KBank', logoSrc: '/images/banks/kbank.webp' },
  { id: 'bay', label: 'BAY', logoSrc: '/images/banks/bay.webp' },
  { id: 'scb', label: 'SCB', logoSrc: '/images/banks/scb.webp' },
  { id: 'omise', label: 'Omise', logoSrc: '/images/banks/omise.webp' },
]
