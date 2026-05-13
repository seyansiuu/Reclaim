import { useCallback, useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { Link, useNavigate } from 'react-router-dom'

import { db } from '../firebase/config'

function getItemTime(item) {
  if (item.createdAt?.toMillis) return item.createdAt.toMillis()
  if (item.date) return new Date(item.date).getTime() || 0
  return 0
}

function Home() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    total: 0,
    lost: 0,
    found: 0,
    resolved: 0,
  })
  const [recentLost, setRecentLost] = useState([])
  const [recentFound, setRecentFound] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchHomeData = useCallback(async () => {
    await Promise.resolve()

    try {
      const snapshot = await getDocs(collection(db, 'items'))
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      let lost = 0
      let found = 0
      let resolved = 0

      items.forEach(item => {
        if (item.type === 'lost') lost++
        if (item.type === 'found') found++
        if (item.status !== 'active') resolved++
      })

      const activeItems = items
        .filter(item => item.status === 'active')
        .sort((a, b) => getItemTime(b) - getItemTime(a))

      setStats({
        total: items.length,
        lost,
        found,
        resolved,
      })
      setRecentLost(activeItems.filter(item => item.type === 'lost').slice(0, 4))
      setRecentFound(activeItems.filter(item => item.type === 'found').slice(0, 4))
    } catch (err) {
      console.error(err)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      fetchHomeData()
    }, 0)
    return () => clearTimeout(loadTimer)
  }, [fetchHomeData])

  const statCards = [
    ['Total Posted', stats.total],
    ['Lost', stats.lost],
    ['Found', stats.found],
    ['Resolved', stats.resolved],
  ]

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 1rem' }}>
      <section style={{
        padding: 'clamp(3.5rem, 9vw, 6.5rem) 0 2rem',
      }}>
        <h1 style={{
          fontSize: 'clamp(2.7rem, 8vw, 5rem)',
          lineHeight: 0.96,
          fontWeight: 800,
          color: '#111',
          maxWidth: '760px',
        }}>
          Lost something on campus?
        </h1>
        <p style={{
          color: '#666',
          fontSize: 'clamp(1rem, 2.4vw, 1.25rem)',
          lineHeight: 1.55,
          marginTop: '1rem',
          maxWidth: '560px',
        }}>
          Connects students to recover lost belongings — fast.
        </p>

        <div style={{
          display: 'flex',
          gap: '0.85rem',
          flexWrap: 'wrap',
          marginTop: '2rem',
        }}>
          <Link to="/browse" style={primaryBtn}>Browse Items</Link>
          <Link to="/post" style={outlineBtn}>+ Post an Item</Link>
        </div>
      </section>

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        margin: '1.5rem 0 4rem',
      }}>
        {statCards.map(([label, value]) => (
          <div key={label} style={statCard}>
            <p style={statValue}>{loading ? '—' : value}</p>
            <p style={statLabel}>{label}</p>
          </div>
        ))}
      </section>

      <RecentSection
        title="Recently Lost"
        type="lost"
        items={recentLost}
        dotColor="#059669"
        onCardClick={(id) => navigate(`/item/${id}`)}
      />

      <RecentSection
        title="Recently Found"
        type="found"
        items={recentFound}
        dotColor="#059669"
        onCardClick={(id) => navigate(`/item/${id}`)}
      />

      <section style={{
        margin: '4rem 0 1rem',
        padding: '2rem 1.25rem',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        background: '#FAFAFA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <h2 style={{
          fontSize: 'clamp(1.35rem, 4vw, 2rem)',
          lineHeight: 1.15,
          fontWeight: 800,
          color: '#111',
        }}>
          Can't find what you're looking for?
        </h2>
        <Link to="/post" style={purpleBtn}>+ Post a Lost Item</Link>
      </section>
    </div>
  )
}

function RecentSection({ title, type, items, dotColor, onCardClick }) {
  return (
    <section style={{ marginBottom: '3.5rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.55rem',
        marginBottom: '1rem',
      }}>
        <span style={{
          width: '9px',
          height: '9px',
          borderRadius: '50%',
          background: dotColor,
        }} />
        <h2 style={{
          fontSize: 'clamp(1.35rem, 4vw, 1.9rem)',
          fontWeight: 800,
          color: '#111',
        }}>
          {title}
        </h2>
      </div>

      {items.length === 0 ? (
        <div style={{
          border: '1px dashed #E5E7EB',
          borderRadius: '8px',
          padding: '2rem 1rem',
          color: '#999',
          textAlign: 'center',
          background: '#fff',
        }}>
          No active items yet.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1rem',
        }}>
          {items.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onCardClick(item.id)}
              style={{
                ...recentCard,
                backgroundImage: item.imageUrl
                  ? `linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.72)), url(${item.imageUrl})`
                  : 'linear-gradient(135deg, #F3F4F6, #E5E7EB)',
                color: item.imageUrl ? '#fff' : '#111',
              }}
            >
              <span className={`badge ${type === 'lost' ? 'lost' : 'found'}`} style={{
                alignSelf: 'flex-start',
                background: type === 'lost' ? '#FEE2E2' : '#D1FAE5',
                color: type === 'lost' ? '#B91C1C' : '#047857',
              }}>
                {type === 'lost' ? 'Lost' : 'Found'}
              </span>
              <span style={{ marginTop: 'auto', textAlign: 'left' }}>
                <span style={{ display: 'block', fontSize: '1.05rem', fontWeight: 800 }}>
                  {item.title}
                </span>
                <span style={{
                  display: 'block',
                  color: item.imageUrl ? 'rgba(255,255,255,0.78)' : '#666',
                  fontSize: '0.86rem',
                  marginTop: '0.35rem',
                }}>
                  {item.location}
                </span>
                <span style={{
                  display: 'block',
                  color: item.imageUrl ? 'rgba(255,255,255,0.66)' : '#999',
                  fontSize: '0.75rem',
                  marginTop: '0.35rem',
                }}>
                  {item.date}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

const primaryBtn = {
  background: '#111',
  color: '#fff',
  padding: '0.75rem 1.5rem',
  borderRadius: '10px',
  border: 'none',
  fontWeight: '600',
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: 'opacity 0.15s',
  textDecoration: 'none',
}

const purpleBtn = {
  background: '#7C3AED',
  color: '#fff',
  padding: '0.75rem 1.5rem',
  borderRadius: '10px',
  border: 'none',
  fontWeight: '600',
  fontSize: '0.9rem',
  cursor: 'pointer',
  textDecoration: 'none',
}

const outlineBtn = {
  background: 'transparent',
  color: '#111',
  padding: '0.75rem 1.5rem',
  borderRadius: '10px',
  border: '1.5px solid #111',
  fontWeight: '600',
  fontSize: '0.9rem',
  cursor: 'pointer',
  textDecoration: 'none',
}

const statCard = {
  border: '1px solid #E5E7EB',
  borderLeft: '3px solid #7C3AED',
  borderRadius: '8px',
  padding: '1.2rem',
  background: '#fff',
}

const statValue = {
  fontSize: '2rem',
  fontWeight: 800,
  color: '#7C3AED',
  lineHeight: 1,
}

const statLabel = {
  color: '#666',
  fontSize: '0.82rem',
  marginTop: '0.55rem',
  fontWeight: 600,
}

const recentCard = {
  minHeight: '210px',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  padding: '1rem',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'left',
  fontFamily: 'inherit',
  transition: 'transform 0.15s, box-shadow 0.15s',
}

export default Home
