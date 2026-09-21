import { useEffect, useRef, useState } from 'react'
import { cloudName, isConfigured, loadCloudinary, uploadPreset } from '@/lib/cloudinary'

export default function ImageField({ value, onChange }) {
  const [error, setError] = useState('')
  const [opening, setOpening] = useState(false)
  const [broken, setBroken] = useState(false)
  const widget = useRef(null)

  // The widget appends its own DOM, so it has to be torn down explicitly.
  useEffect(() => () => widget.current?.destroy(), [])

  async function open() {
    setError('')
    setOpening(true)
    try {
      const cloudinary = await loadCloudinary()
      widget.current ??= cloudinary.createUploadWidget(
        {
          cloudName,
          uploadPreset,
          sources: ['local', 'url', 'camera'],
          multiple: false,
          maxFiles: 1,
          language: 'ko',
          clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp', 'avif'],
          maxFileSize: 10_000_000,
        },
        (uploadError, result) => {
          if (uploadError) {
            setError('업로드에 실패했습니다. 다시 시도해 주세요.')
            return
          }
          if (result?.event === 'success') {
            setError('')
            setBroken(false)
            onChange(result.info.secure_url)
          }
        },
      )
      widget.current.open()
    } catch {
      setError('업로드 위젯을 불러오지 못했습니다. 연결 상태를 확인해 주세요.')
    } finally {
      setOpening(false)
    }
  }

  return (
    <div className="form-field image-field">
      <label htmlFor="image">메인 이미지 <span className="optional">(선택)</span></label>

      {isConfigured
        ? <div className="image-actions">
          <button className="upload-button" type="button" onClick={open} disabled={opening}>
            {opening ? '여는 중…' : value ? '이미지 변경' : '이미지 업로드'}
          </button>
          {value && <button className="image-remove" type="button"
            onClick={() => { onChange(''); setBroken(false) }}>제거</button>}
        </div>
        : <>
          <input id="image" value={value} placeholder="https://example.com/door.jpg"
            onChange={(event) => { onChange(event.target.value); setBroken(false) }} />
          <small>
            Cloudinary 업로드를 쓰려면 client/.env에 VITE_CLOUDINARY_CLOUD_NAME과
            VITE_CLOUDINARY_UPLOAD_PRESET을 설정하세요. 지금은 주소 입력만 가능합니다.
          </small>
        </>}

      {error && <p className="field-error">{error}</p>}

      {value && <figure className="image-preview">
        {broken
          ? <p className="preview-broken">이미지를 불러오지 못했습니다.</p>
          : <img src={value} alt="상품 이미지 미리보기" onError={() => setBroken(true)} />}
        <figcaption>{value}</figcaption>
      </figure>}
    </div>
  )
}
