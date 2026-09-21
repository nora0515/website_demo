function Icon({ kind }) {
  const paths = {
    cart: <><path d="M4 5h2l2.2 10.2a2 2 0 0 0 2 1.6h7.1a2 2 0 0 0 2-1.5L21 8H7" /><circle cx="10" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /></>,
    box: <><path d="M21 8.5 12 13 3 8.5 12 4l9 4.5Z" /><path d="M3 8.5v7L12 20l9-4.5v-7" /><path d="M12 13v7" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a5 5 0 0 1 10 0v2" /><path d="M16 5.5a3 3 0 0 1 0 5.8" /><path d="M17 14.5a5 5 0 0 1 4 4.9V20" /></>,
    trend: <><path d="m4 16 5-5 3.5 3.5L20 7" /><path d="M15 7h5v5" /></>,
  }
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>
}

export default function StatCard({ label, value, delta, icon, tone, pending }) {
  return (
    <article className="stat-card">
      <div className="stat-text">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{pending ? <span className="stat-skeleton" aria-hidden="true" /> : value}</p>
        <p className="stat-delta">{delta}</p>
      </div>
      <span className={`stat-icon tone-${tone}`}><Icon kind={icon} /></span>
    </article>
  )
}
