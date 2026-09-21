const WINDOW = 5

// Shows at most WINDOW numbers, sliding to keep the current page centred.
function pageNumbers(page, totalPages) {
  const start = Math.max(1, Math.min(page - Math.floor(WINDOW / 2), totalPages - WINDOW + 1))
  const count = Math.min(WINDOW, totalPages)
  return Array.from({ length: count }, (unused, index) => start + index)
}

function Arrow({ direction }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={direction === 'prev' ? 'm15 19-7-7 7-7' : 'm9 5 7 7-7 7'} />
    </svg>
  )
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  return (
    <nav className="pagination" aria-label="페이지">
      <button className="page-arrow" type="button" disabled={page === 1}
        onClick={() => onChange(page - 1)} aria-label="이전 페이지">
        <Arrow direction="prev" />
      </button>
      {pageNumbers(page, totalPages).map((number) => (
        <button key={number} type="button"
          className={number === page ? 'page-number is-active' : 'page-number'}
          aria-current={number === page ? 'page' : undefined}
          onClick={() => onChange(number)}>{number}</button>
      ))}
      <button className="page-arrow" type="button" disabled={page === totalPages}
        onClick={() => onChange(page + 1)} aria-label="다음 페이지">
        <Arrow direction="next" />
      </button>
    </nav>
  )
}
