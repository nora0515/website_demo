import { useEffect, useRef, useState } from 'react'

export default function UserMenu({ name, onSignOut }) {
  const [open, setOpen] = useState(false)
  const menu = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(event) {
      // A click anywhere outside the menu closes it.
      if (!menu.current?.contains(event.target)) setOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="user-menu" ref={menu}>
      <button className="user-menu-trigger" type="button" aria-haspopup="menu"
        aria-expanded={open} onClick={() => setOpen(!open)}>
        <span><strong>{name}</strong>님 환영합니다</span>
        <svg className={open ? 'chevron open' : 'chevron'} width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          strokeLinejoin="round" aria-hidden="true"><path d="m5 9 7 7 7-7" /></svg>
      </button>
      {open && <div className="user-menu-list" role="menu">
        <button className="user-menu-item" type="button" role="menuitem" onClick={onSignOut}>
          로그아웃
        </button>
      </div>}
    </div>
  )
}
