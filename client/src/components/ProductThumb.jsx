const TONES = ['sand', 'olive', 'mist', 'stone', 'ink']

// Products without a photo still need to look deliberate, so each one gets a
// stable tint derived from its SKU rather than a random or identical one.
function toneFor(sku = '') {
  let sum = 0
  for (let i = 0; i < sku.length; i += 1) sum += sku.charCodeAt(i)
  return TONES[sum % TONES.length]
}

export default function ProductThumb({ sku, className = 'thumb' }) {
  return (
    <div className={`${className} tone-${toneFor(sku)}`} aria-hidden="true">
      <svg viewBox="0 0 120 150" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="18" y="12" width="84" height="126" rx="2" />
        <rect x="26" y="20" width="32" height="110" rx="1" />
        <rect x="62" y="20" width="32" height="110" rx="1" />
        <path d="M26 56h68M26 94h68" />
        <circle cx="58" cy="76" r="2.2" />
      </svg>
    </div>
  )
}
