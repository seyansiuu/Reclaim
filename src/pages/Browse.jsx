import { useCallback, useEffect, useState, useMemo } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { Link } from 'react-router-dom'

const LOCATIONS  = ['All', 'Library', 'Atrium', 'Auditorium', 'A Block Mess', 'CCD', 'C Block', 'B Block', 'Chai Adda', 'Learners Arena', 'Pushpa Devi Mess', 'Football Ground', 'Basketball Court', 'Tennis Court', 'Main Ground', 'R1', 'R2', 'R3', 'Other']
const CATEGORIES = ['All', 'ID Card', 'Wallet', 'Phone', 'Earphones', 'Laptop', 'Bottle', 'Keys', 'Bag', 'Charger', 'Stationery', 'Clothing', 'Other']

function getItemTime(item) {
  if (item.createdAt?.toMillis) return item.createdAt.toMillis()
  if (item.date) return new Date(item.date).getTime() || 0
  return 0
}

function SkeletonCard() {
  return (
    <div className="card skeleton-card flex flex-col gap-xs">

      <div className="flex gap-xs">
        <div className="shimmer-bg skeleton-pill-sm" />
        <div className="shimmer-bg skeleton-pill-md ml-auto" />
      </div>

      <div className="shimmer-bg skeleton-line-md" />
      <div className="shimmer-bg skeleton-line-lg" />
      <div className="shimmer-bg skeleton-line-sm" />

    </div>
  )
}

function ErrorState({ onRetry, errorMessage }) {
  return (
    <div className="empty-state flex flex-col align-center">

      <p className="error-icon">
        ⚠️
      </p>

      <p className="heading-md mb-1">
        Failed to load items
      </p>

      <p className="text-sm text-light mb-3 error-text">
        {errorMessage || 'Check your internet connection and try again.'}
      </p>

      <button
        onClick={onRetry}
        className="btn btn-primary"
      >
        Try again
      </button>

    </div>
  )
}

function Browse() {

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const [location, setLocation] = useState('All')
  const [locationText, setLocationText] = useState('')

  const [category, setCategory] = useState('All')

  const [exactDate, setExactDate] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchItems = useCallback(async () => {
    await Promise.resolve()

    setLoading(true)
    setError(null)

    try {
      const snapshot = await getDocs(collection(db, 'items'))
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => getItemTime(b) - getItemTime(a))
      setItems(data)

    } catch (err) {

      console.error(err)

      setError(
        err.message || 'An unexpected error occurred'
      )

    }

    setLoading(false)
  }, [])

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      fetchItems()
    }, 0)
    return () => clearTimeout(loadTimer)
  }, [fetchItems])

  const filtered = useMemo(() => {

    const kw = keyword.trim().toLowerCase()
    const loc = locationText.trim().toLowerCase()

    return items.filter(item => {

      if (
        typeFilter !== 'all' &&
        item.type !== typeFilter
      ) return false

      if (
        kw &&
        !item.title?.toLowerCase().includes(kw) &&
        !item.description?.toLowerCase().includes(kw)
      ) return false

      if (
        location !== 'All' &&
        !item.location
          ?.toLowerCase()
          .startsWith(location.toLowerCase())
      ) return false

      if (
        loc &&
        !item.location
          ?.toLowerCase()
          .includes(loc)
      ) return false

      if (
        category !== 'All' &&
        item.category?.toLowerCase() !== category.toLowerCase()
      ) return false

      if (
        exactDate &&
        item.date !== exactDate
      ) return false

      if (!exactDate) {

        if (dateFrom && item.date < dateFrom)
          return false

        if (dateTo && item.date > dateTo)
          return false
      }

      return true
    })

  }, [
    items,
    keyword,
    typeFilter,
    location,
    locationText,
    category,
    exactDate,
    dateFrom,
    dateTo,
  ])

  const hasFilters =
    keyword ||
    typeFilter !== 'all' ||
    location !== 'All' ||
    locationText ||
    category !== 'All' ||
    exactDate ||
    dateFrom ||
    dateTo

  function clearAll() {

    setKeyword('')
    setTypeFilter('all')

    setLocation('All')
    setLocationText('')

    setCategory('All')

    setExactDate('')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="container">

      {/* Header */}
      <div className="flex flex-between align-center mb-3">

        <h2 className="heading-lg">
          Browse Items
        </h2>

        <Link
          to="/post"
          className="btn btn-primary browse-post-btn"
        >
          + Post Item
        </Link>

      </div>

      {/* Filters */}
      <div className="filters-panel">

        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Search by keyword..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          className="input-field"
        />

        {/* Type + Category */}
        <div className="filters-row">

          <div className="filter-input-auto">

            <label className="form-label">
              I am looking for
            </label>

            <div className="flex gap-xs">

              {['all', 'lost', 'found'].map(type => (

                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`btn filter-btn ${
                    typeFilter === type
                      ? 'btn-primary'
                      : 'btn-outline'
                  }`}
                >
                  {type}
                </button>

              ))}

            </div>

          </div>

          <div className="filter-input-auto">

            <label className="form-label">
              Category
            </label>

            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="input-field"
            >

              {CATEGORIES.map(category => (
                <option
                  key={category}
                  value={category}
                >
                  {category === 'All'
                    ? 'All Categories'
                    : category}
                </option>
              ))}

            </select>

          </div>

        </div>

        {/* Location */}
        <div className="filters-row">

          <div className="filter-input-auto">

            <label className="form-label">
              Location Area
            </label>

            <select
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="input-field"
            >

              {LOCATIONS.map(location => (
                <option
                  key={location}
                  value={location}
                >
                  {location === 'All'
                    ? 'All Areas'
                    : location}
                </option>
              ))}

            </select>

          </div>

          <div className="filter-input-auto">

            <label className="form-label">
              Specific Spot
            </label>

            <input
              type="text"
              placeholder="e.g. floor, table..."
              value={locationText}
              onChange={e =>
                setLocationText(e.target.value)
              }
              className="input-field"
            />

          </div>

        </div>

        {/* Dates */}
        <div className="filters-row">

          <div className="filter-input-auto">

            <label className="form-label">
              Exact Date
            </label>

            <input
              type="date"
              value={exactDate}
              onChange={e => {
                setExactDate(e.target.value)
                setDateFrom('')
                setDateTo('')
              }}
              className="input-field"
            />

          </div>

          <div className="filter-input-small">

            <label className="form-label">
              From
            </label>

            <input
              type="date"
              value={dateFrom}
              onChange={e => {
                setDateFrom(e.target.value)
                setExactDate('')
              }}
              className="input-field"
            />

          </div>

          <div className="filter-input-small">

            <label className="form-label">
              To
            </label>

            <input
              type="date"
              value={dateTo}
              onChange={e => {
                setDateTo(e.target.value)
                setExactDate('')
              }}
              className="input-field"
            />

          </div>

        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="btn-ghost text-xs fw-600 clear-btn"
          >
            Clear all filters
          </button>
        )}

      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-sm">
          {[...Array(5)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <ErrorState
          onRetry={fetchItems}
          errorMessage={error}
        />
      )}

      {/* Results */}
      {!loading && !error && (
        <>

          <p className="text-xs text-light mb-2">

            {filtered.length}{' '}

            {filtered.length === 1
              ? 'item'
              : 'items'} found

            {hasFilters
              ? ' for current filters'
              : ''}

          </p>

          {/* Empty */}
          {filtered.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '3rem 1rem', color: '#bbb',
              border: '0.5px dashed #e0e0e0', borderRadius: '12px',
            }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{hasFilters ? '🔍' : '📭'}</p>
              <p style={{ fontWeight: '500', color: '#999', marginBottom: '0.4rem' }}>
                {hasFilters ? 'No items match your filters.' : 'No items present.'}
              </p>

              <p className="text-sm text-light mb-3">
                {hasFilters
                  ? 'Try different filters.'
                  : 'Be the first to post an item.'}
              </p>

              {!hasFilters && (
                <Link
                  to="/post"
                  className="btn btn-primary"
                >
                  + Post an item
                </Link>
              )}

            </div>

          )}

          {/* Items */}
          <div className="flex flex-col gap-sm">

            {filtered.map(item => (

              <Link
                key={item.id}
                to={`/item/${item.id}`}
                className="item-link"
              >

                <div
                  className={`item-card hoverable browse-card-${item.type} ${
                    item.status !== 'active'
                      ? 'resolved'
                      : ''
                  }`}
                >

                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        flex: '0 0 auto',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      background: '#F3F4F6',
                      color: '#7C3AED',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      flex: '0 0 auto',
                    }}>
                      {item.title?.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="item-card-content">

                    <div className="item-card-topline">
                      <p className="item-card-title">
                        {item.title}
                      </p>

                      <span
                        className={`badge ${
                          item.type === 'lost'
                            ? 'lost'
                            : 'found'
                        }`}
                      >
                        {item.type === 'lost'
                          ? 'Lost'
                          : 'Found'}
                      </span>
                    </div>

                    <p className="text-xs text-light item-card-meta">
                      {item.location || 'Location unknown'} · {item.date || 'Date unknown'}
                    </p>


                    <div className="item-card-badges">

                      {item.status !== 'active' && (
                        <span className="badge returned">
                          Resolved ✓
                        </span>
                      )}

                      {item.category && (
                        <span className="badge neutral">
                          {item.category}
                        </span>
                      )}

                    </div>

                    {/* Description */}
                    {item.description && (
                      <p className="item-card-desc item-desc-spacing">
                        {item.description}
                      </p>
                    )}

                  </div>

                  <span className="item-card-arrow">
                    View →
                  </span>

                </div>

              </Link>

            ))}

          </div>

        </>
      )}

    </div>
  )
}


export default Browse
