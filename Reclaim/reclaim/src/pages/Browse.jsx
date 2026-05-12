import { useEffect, useMemo, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { Link } from 'react-router-dom'

import { db } from '../firebase/config'

const LOCATIONS = [
  'All', 'Library', 'Atrium', 'Auditorium', 'A Block Mess',
  'CCD', 'C Block', 'B Block', 'Chai Adda', 'Learners Arena',
  'Pushpa Devi Mess', 'Football Ground', 'Basketball Court',
  'Tennis Court', 'Main Ground', 'R1', 'R2', 'R3', 'Other',
]

const CATEGORIES = [
  'All', 'ID Card', 'Wallet', 'Phone', 'Earphones',
  'Laptop', 'Bottle', 'Keys', 'Bag', 'Charger',
  'Stationery', 'Clothing', 'Other',
]

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

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {

    setLoading(true)
    setError(null)

    try {

      const q = query(
        collection(db, 'items'),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(q)

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))

      setItems(data)

    } catch (err) {

      console.error(err)

      setError(
        err.message || 'An unexpected error occurred'
      )

    }

    setLoading(false)
  }

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

            <div className="empty-state">

              <p className="empty-icon">
                {hasFilters ? '🔍' : '📭'}
              </p>

              <p className="heading-md mb-1">
                {hasFilters
                  ? 'No items match your filters.'
                  : 'Nothing posted yet.'}
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
                  className={`item-card hoverable ${
                    item.status !== 'active'
                      ? 'resolved'
                      : ''
                  }`}
                >

                  <div className="item-card-content">

                    {/* Badges */}
                    <div className="item-card-badges">

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

                      <span className="text-xs text-light">
                        {item.date}
                      </span>

                    </div>

                    {/* Title */}
                    <p className="item-card-title">
                      {item.title}
                    </p>

                    {/* Description */}
                    {item.description && (
                      <p className="item-card-desc item-desc-spacing">
                        {item.description}
                      </p>
                    )}

                    {/* Location */}
                    <p className="text-xs text-light flex align-center gap-xs">
                      📍 {item.location}
                    </p>

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