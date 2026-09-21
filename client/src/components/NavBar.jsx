import UserMenu from './UserMenu'

function Icon({ kind }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    cart: <><path d="M4 5h2l2.2 10.2a2 2 0 0 0 2 1.6h7.1a2 2 0 0 0 2-1.5L21 8H7" /><circle cx="10" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /></>,
  }
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>
}

export default function NavBar({ user, loading, onSignOut, cartCount = 0, solid = true, categories, active, onSelect }) {
  return (
    <header className={solid ? 'nav is-solid' : 'nav is-overlay'}>
      <div className="nav-top">
        <a className="brand" href="/">NORAMALL</a>
        <div className="nav-actions">
          <button className="icon-button" type="button" aria-label="검색"><Icon kind="search" /></button>
          <a className="icon-button cart-link" href="/cart" aria-label={`장바구니 ${cartCount}개`}>
            <Icon kind="cart" />
            {cartCount > 0 && <span className="cart-count">{cartCount > 99 ? '99+' : cartCount}</span>}
          </a>
          {/* The admin entry is only rendered for admin accounts. */}
          {user?.user_type === 'admin' && <a className="admin-button" href="/admin">어드민</a>}
          {/* While the token is still being checked, neither state is shown, so the
              bar does not flash "로그인" at someone who is already signed in. */}
          {loading ? <span className="nav-placeholder" aria-hidden="true" />
            : user ? <UserMenu name={user.user_type === 'admin' ? 'admin' : user.name} onSignOut={onSignOut} />
              : <a className="login-button" href="/login">로그인</a>}
        </div>
      </div>
      <nav className="nav-categories" aria-label="상품 분류">
        {categories.map((category) => (
          <button key={category} type="button"
            className={category === active ? 'category is-active' : 'category'}
            aria-current={category === active ? 'true' : undefined}
            onClick={() => onSelect(category)}>{category}</button>
        ))}
      </nav>
    </header>
  )
}
