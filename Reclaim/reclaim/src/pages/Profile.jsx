import { useEffect, useState } from 'react'
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'

import { useNavigate } from 'react-router-dom'
import { db, auth } from '../firebase/config'

const LOCATIONS = [
  'Library', 'Atrium', 'Auditorium', 'A Block Mess', 'CCD', 'C Block',
  'B Block', 'Chai Adda', 'Learners Arena', 'Pushpa Devi Mess',
  'Football Ground', 'Basketball Court', 'Tennis Court',
  'Main Ground', 'R1', 'R2', 'R3', 'Other',
]

const CATEGORIES = [
  'ID Card', 'Wallet', 'Phone', 'Earphones', 'Laptop',
  'Bottle', 'Keys', 'Bag', 'Charger',
  'Stationery', 'Clothing', 'Other',
]

const STATUS_LABEL = {
  active: 'Active',
  returned: 'Returned',
  reclaimed: 'Resolved',
}

function Section({ title, items, children }) {
  return (
    <div className="mb-4">

      <div className="flex align-center gap-xs mb-3">

        <h3 className="heading-md section-title">
          {title}
        </h3>

        <span className="badge neutral text-xs">
          {items.length}
        </span>

      </div>

      {items.length === 0 ? (
        <div className="empty-state section-empty">
          <p className="text-sm">
            No items reported yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-sm">
          {children}
        </div>
      )}

    </div>
  )
}

function ItemRow({
  item,
  onEdit,
  onDelete,
  onMarkReturned,
  onMarkReclaimed,
}) {

  const [confirm, setConfirm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editTitle, setEditTitle] = useState(item.title)
  const [editDesc, setEditDesc] = useState(item.description)
  const [editLoc, setEditLoc] = useState(item.location)
  const [editCat, setEditCat] = useState(item.category || '')

  async function handleSave() {

    if (
      !editTitle.trim() ||
      !editDesc.trim() ||
      !editLoc
    ) return

    setSaving(true)

    await onEdit(item.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      location: editLoc,
      category: editCat,
    })

    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="profile-item-row">

      <div className="profile-item-header">

        <div className="flex gap-xs flex-wrap align-center">

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

          <span className={`badge ${item.status}`}>
            {STATUS_LABEL[item.status]}
          </span>

          {item.category && (
            <span className="badge neutral">
              {item.category}
            </span>
          )}

        </div>

        <span className="text-xs text-light fw-500">
          {item.date}
        </span>

      </div>

      {editing ? (

        <div className="flex flex-col gap-sm mt-2">

          <input
            type="text"
            value={editTitle}
            onChange={e =>
              setEditTitle(e.target.value)
            }
            className="input-field"
          />

          <textarea
            rows={2}
            value={editDesc}
            onChange={e =>
              setEditDesc(e.target.value)
            }
            className="input-field"
          />

          <div className="flex gap-sm">

            <select
              value={editCat}
              onChange={e =>
                setEditCat(e.target.value)
              }
              className="input-field"
            >

              {CATEGORIES.map(category => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}

            </select>

            <select
              value={editLoc}
              onChange={e =>
                setEditLoc(e.target.value)
              }
              className="input-field"
            >

              {LOCATIONS.map(location => (
                <option
                  key={location}
                  value={location}
                >
                  {location}
                </option>
              ))}

            </select>

          </div>

          <div className="flex gap-sm">

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary flex-1"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>

            <button
              onClick={() => setEditing(false)}
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>

          </div>

        </div>

      ) : (

        <div className="mt-1">

          <p className="profile-item-title">
            {item.title}
          </p>

          <p className="text-xs text-light mt-1">
            {item.location}
          </p>

          <p className="text-sm text-muted mt-1 item-desc">
            {item.description}
          </p>

        </div>

      )}

      {item.status === 'active' && !editing && (

        <div className="flex gap-xs flex-wrap mt-2">

          {item.type === 'found' && (
            <button
              onClick={() =>
                onMarkReturned(item.id)
              }
              className="btn-action success"
            >
              Mark as Returned
            </button>
          )}

          {item.type === 'lost' && (
            <button
              onClick={() =>
                onMarkReclaimed(item.id)
              }
              className="btn-action info"
            >
              Got it Back
            </button>
          )}

          <button
            onClick={() => setEditing(true)}
            className="btn-action neutral"
          >
            Edit
          </button>

          {!confirm ? (

            <button
              onClick={() => setConfirm(true)}
              className="btn-action danger"
            >
              Delete
            </button>

          ) : (

            <div className="flex gap-xs align-center">

              <span className="text-xs fw-600 text-danger">
                Sure?
              </span>

              <button
                onClick={() =>
                  onDelete(item.id)
                }
                className="btn-action danger-solid"
              >
                Yes
              </button>

              <button
                onClick={() =>
                  setConfirm(false)
                }
                className="btn-action neutral"
              >
                Cancel
              </button>

            </div>

          )}

        </div>

      )}

    </div>
  )
}

function Profile() {

  const navigate = useNavigate()
  const user = auth.currentUser

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    if (!user) {
      navigate('/login')
      return
    }

    fetchItems()

  }, [user])

  async function fetchItems() {

    try {

      const q = query(
        collection(db, 'items'),
        where('postedBy', '==', user.uid),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(q)

      setItems(
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
      )

    } catch (err) {

      console.error(err)

    }

    setLoading(false)
  }

  async function updateStatus(id, status) {

    await updateDoc(
      doc(db, 'items', id),
      { status }
    )

    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, status }
          : item
      )
    )
  }

  async function handleDelete(id) {

    await deleteDoc(
      doc(db, 'items', id)
    )

    setItems(prev =>
      prev.filter(item => item.id !== id)
    )
  }

  async function handleEdit(id, updates) {

    await updateDoc(
      doc(db, 'items', id),
      updates
    )

    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, ...updates }
          : item
      )
    )
  }

  const myFound = []
  const myLost = []

  let totalActive = 0
  let totalResolved = 0

  items.forEach(item => {

    if (item.type === 'found') {
      myFound.push(item)
    } else {
      myLost.push(item)
    }

    if (item.status === 'active') {
      totalActive++
    } else {
      totalResolved++
    }

  })

  if (loading) {
    return (
      <div className="empty-state">
        Loading profile...
      </div>
    )
  }

  return (
    <div className="container-sm">

      {/* Header */}
      <div className="mb-4">

        <h2 className="heading-lg mb-1">
          My Profile
        </h2>

        <p className="text-sm text-light fw-500">
          {user.email}
        </p>

      </div>

      {/* Stats */}
      <div className="profile-stats-container">

        <div className="profile-stat-box">
          <p className="profile-stat-val">
            {items.length}
          </p>
          <p className="profile-stat-lbl">
            Total Posted
          </p>
        </div>

        <div className="profile-stat-box stat-active">
          <p className="profile-stat-val stat-active-text">
            {totalActive}
          </p>
          <p className="profile-stat-lbl">
            Active
          </p>
        </div>

        <div className="profile-stat-box stat-resolved">
          <p className="profile-stat-val stat-resolved-text">
            {totalResolved}
          </p>
          <p className="profile-stat-lbl">
            Resolved
          </p>
        </div>

      </div>

      {/* Found */}
      <Section
        title="Items I Found"
        items={myFound}
      >

        {myFound.map(item => (
          <ItemRow
            key={item.id}
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMarkReturned={id =>
              updateStatus(id, 'returned')
            }
            onMarkReclaimed={id =>
              updateStatus(id, 'reclaimed')
            }
          />
        ))}

      </Section>

      {/* Lost */}
      <Section
        title="Items I Lost"
        items={myLost}
      >

        {myLost.map(item => (
          <ItemRow
            key={item.id}
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMarkReturned={id =>
              updateStatus(id, 'returned')
            }
            onMarkReclaimed={id =>
              updateStatus(id, 'reclaimed')
            }
          />
        ))}

      </Section>

    </div>
  )
}

export default Profile