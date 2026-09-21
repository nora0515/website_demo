import { useRef, useState } from 'react'
import { createProduct } from '@/api/products'

// Kept in step with the enum on the server's Product schema.
const CATEGORIES = ['중문', '도어', '인테리어 필름']

export default function ProductForm({ onCreated }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState('')
  const submitting = useRef(false)

  function clearError(event) {
    setErrors((previous) => ({ ...previous, [event.target.name]: '' }))
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    if (submitting.current) return
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    const price = Number(values.price)
    const invalid = {}
    if (!values.sku.trim()) invalid.sku = 'SKU를 입력해 주세요.'
    if (!values.name.trim()) invalid.name = '상품명을 입력해 주세요.'
    if (!values.price.trim() || !Number.isInteger(price) || price < 0) {
      invalid.price = '0 이상의 정수를 입력해 주세요.'
    }
    if (!values.category) invalid.category = '카테고리를 선택해 주세요.'
    setErrors(invalid)
    setError('')
    setDone('')
    if (Object.keys(invalid).length) {
      form.elements.namedItem(Object.keys(invalid)[0]).focus()
      return
    }
    submitting.current = true
    setBusy(true)
    try {
      // Optional fields are left out entirely rather than sent as empty strings.
      const { product } = await createProduct({
        sku: values.sku.trim(),
        name: values.name.trim(),
        price,
        category: values.category,
        ...(values.image.trim() ? { image: values.image.trim() } : {}),
        ...(values.description.trim() ? { description: values.description.trim() } : {}),
      })
      form.reset()
      setDone(`${product.name} (${product.sku}) 등록이 완료되었습니다.`)
      onCreated?.(product)
    } catch (err) {
      setError(err.message)
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return (
    <form className="product-form" onSubmit={submit}>
      <fieldset disabled={busy}>
        <h2>새 상품 등록</h2>
        <div className="form-columns">
          <div className="form-column">
            <div className="form-field">
              <label htmlFor="name">상품명</label>
              <input id="name" name="name" placeholder="상품명을 입력하세요" required onChange={clearError}
                aria-invalid={Boolean(errors.name)} />
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="price">판매가격</label>
                <input id="price" name="price" type="number" min="0" step="1" placeholder="0"
                  required onChange={clearError} aria-invalid={Boolean(errors.price)} />
                {errors.price && <p className="field-error">{errors.price}</p>}
              </div>
              <div className="form-field">
                <label htmlFor="sku">SKU</label>
                <input id="sku" name="sku" placeholder="MD-001" required onChange={clearError}
                  aria-invalid={Boolean(errors.sku)} />
                {errors.sku && <p className="field-error">{errors.sku}</p>}
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="category">카테고리</label>
              <select id="category" name="category" defaultValue="" required onChange={clearError}
                aria-invalid={Boolean(errors.category)}>
                <option value="" disabled>카테고리 선택</option>
                {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              {errors.category && <p className="field-error">{errors.category}</p>}
            </div>
          </div>

          <div className="form-column">
            <div className="form-field">
              <label htmlFor="description">상품 설명 <span className="optional">(선택)</span></label>
              <textarea id="description" name="description" rows="6"
                placeholder="상품에 대한 자세한 설명을 입력하세요" />
            </div>
            <div className="form-field">
              <label htmlFor="image">메인 이미지 <span className="optional">(선택)</span></label>
              <input id="image" name="image" placeholder="https://example.com/door.jpg" />
              <small>이미지 파일 업로드는 아직 지원하지 않아 주소를 입력받습니다.</small>
            </div>
          </div>
        </div>

        <div className="form-footer">
          {error && <p className="submit-error" role="alert">{error}</p>}
          {done && <p className="submit-done" role="status">{done}</p>}
          <button className="form-submit" type="submit">{busy ? '등록 중…' : '상품 등록'}</button>
        </div>
      </fieldset>
    </form>
  )
}
