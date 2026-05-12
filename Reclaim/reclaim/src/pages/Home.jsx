import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { Link } from 'react-router-dom'

import { db } from '../firebase/config'

function Home() {

  const [stats, setStats] = useState({
    total: 0,
    lost: 0,
    found: 0,
    resolved: 0,
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {

    try {

      const snapshot = await getDocs(
        collection(db, 'items')
      )

      const items = snapshot.docs.map(doc => doc.data())

      let lost = 0
      let found = 0
      let resolved = 0

      items.forEach(item => {
        if (item.type === 'lost') lost++
        if (item.type === 'found') found++
        if (item.status !== 'active') resolved++
      })

      setStats({
        total: items.length,
        lost,
        found,
        resolved,
      })

    } catch (err) {

      console.error(err)

    }

    setLoading(false)
  }

  const statCards = [
    ['Total Posted', stats.total],
    ['Lost', stats.lost],
    ['Found', stats.found],
    ['Resolved', stats.resolved],
  ]

  return (
    <div className="container-sm">

      {/* Hero */}
      <h1 className="heading-xl mb-2">
        Lost something on campus?
      </h1>

      <p className="home-hero-desc">
        Reclaim is your campus lost & found — post what you lost or found,
        search by location, and get it back fast.
      </p>

      {/* Buttons */}
      <div className="flex gap-md flex-wrap mb-4">

        <Link
          to="/browse"
          className="btn btn-primary home-btn"
        >
          Browse Items
        </Link>

        <Link
          to="/post"
          className="btn btn-secondary home-btn"
        >
          + Post an Item
        </Link>

      </div>

      {/* Stats */}
      <div>

        <p className="home-stats-header">
          Live on campus
        </p>

        <div className="home-stats-grid">

          {statCards.map(([label, value]) => (
            <div key={label} className="home-stat-card">

              <p className="home-stat-value">
                {loading ? '—' : value}
              </p>

              <p className="home-stat-label">
                {label}
              </p>

            </div>
          ))}

        </div>

      </div>

    </div>
  )
}

export default Home