import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

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
  resolved: 'Resolved',
}

function getItemTime(item) {
  if (item.createdAt?.toMillis) return item.createdAt.toMillis()
  if (item.date) return new Date(item.date).getTime() || 0
  return 0
}

function Section({ title, items, emptyMessage, children }) {
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
            {emptyMessage}
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

function ItemRow({ item, onEdit, onDelete, onMarkReturned, onMarkReclaimed }) {
  const [confirm, setConfirm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editTitle, setEditTitle] = useState(item.title)
  const [editDesc, setEditDesc] = useState(item.description)
  const [editLoc, setEditLoc] = useState(item.location)
  const [editCat, setEditCat] = useState(item.category || '')

  async function handleSave() {
    if (!editTitle.trim() || !editDesc.trim() || !editLoc) return

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
          <span className={`badge ${item.type === 'lost' ? 'lost' : 'found'}`}>
            {item.type === 'lost' ? 'Lost' : 'Found'}
          </span>
          <span className={`badge ${item.status || 'active'}`}>
            {STATUS_LABEL[item.status] || item.status || 'Active'}
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
            onChange={e => setEditTitle(e.target.value)}
            className="input-field"
          />
          <textarea
            rows={2}
            value={editDesc}
            onChange={e => setEditDesc(e.target.value)}
            className="input-field"
          />
          <div className="flex gap-sm">
            <select
              value={editCat}
              onChange={e => setEditCat(e.target.value)}
              className="input-field"
            >
              {CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={editLoc}
              onChange={e => setEditLoc(e.target.value)}
              className="input-field"
            >
              {LOCATIONS.map(location => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-sm">
            <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)} className="btn btn-outline" style={{ flex: 1 }}>
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
            <button onClick={() => onMarkReturned(item.id)} className="btn-action success">
              Mark as Returned
            </button>
          )}
          {item.type === 'lost' && (
            <button onClick={() => onMarkReclaimed(item.id)} className="btn-action info">
              Got it Back
            </button>
          )}
          <button onClick={() => setEditing(true)} className="btn-action neutral">
            Edit
          </button>
          {!confirm ? (
            <button onClick={() => setConfirm(true)} className="btn-action danger">
              Delete
            </button>
          ) : (
            <div className="flex gap-xs align-center">
              <span className="text-xs fw-600" style={{ color: '#c53030' }}>
                Sure?
              </span>
              <button onClick={() => onDelete(item.id)} className="btn-action danger-solid">
                Yes
              </button>
              <button onClick={() => setConfirm(false)} className="btn-action neutral">
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ClaimRow({ claim, onAccept, onReject }) {
  const [savingAction, setSavingAction] = useState('')

  const handleAction = async (action) => {
    setSavingAction(action)
    try {
      if (action === 'accept') {
        await onAccept(claim)
      } else {
        await onReject(claim)
      }
    } finally {
      setSavingAction('')
    }
  }

  return (
    <div className="profile-item-row">
      <div className="flex gap-xs flex-wrap align-center">
        <span className={`badge ${claim.itemType === 'lost' ? 'lost' : 'found'}`}>
          {claim.itemType === 'lost' ? 'Lost' : 'Found'}
        </span>
        <p className="profile-item-title">
          {claim.itemTitle}
        </p>
      </div>
      <p className="text-sm text-muted" style={{ margin: 0 }}>
        Claimed by: <span className="fw-600">{claim.claimedByEmail}</span>
      </p>
      <p className="text-sm" style={{ margin: 0, lineHeight: 1.5 }}>
        {claim.message}
      </p>
      <div className="flex gap-xs flex-wrap">
        <button
          onClick={() => handleAction('accept')}
          disabled={!!savingAction}
          className="btn-action success"
        >
          {savingAction === 'accept' ? 'Accepting...' : 'Accept'}
        </button>
        <button
          onClick={() => handleAction('reject')}
          disabled={!!savingAction}
          className="btn-action danger"
        >
          {savingAction === 'reject' ? 'Rejecting...' : 'Reject'}
        </button>
      </div>
    </div>
  )
}

function Profile() {
  const navigate = useNavigate()
  const user = auth.currentUser
  const [items, setItems] = useState([])
  const [pendingClaims, setPendingClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchItems = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(false)
    try {
      const itemsQuery = query(
        collection(db, 'items'),
        where('postedBy', '==', user.uid)
      )
      const snapshot = await getDocs(itemsQuery)
      const nextItems = snapshot.docs
        .map(itemDoc => ({ id: itemDoc.id, ...itemDoc.data() }))
        .sort((a, b) => getItemTime(b) - getItemTime(a))

      setItems(nextItems)
    } catch (err) {
      console.error(err)
      setError(true)
    }
    setLoading(false)
  }, [user])

  const fetchPendingClaims = useCallback(async () => {
    if (!user) return

    try {
      const claimsQuery = query(
        collection(db, 'claims'),
        where('itemPostedBy', '==', user.uid),
        where('status', '==', 'pending')
      )
      const snapshot = await getDocs(claimsQuery)
      setPendingClaims(snapshot.docs.map(claimDoc => ({ id: claimDoc.id, ...claimDoc.data() })))
    } catch (err) {
      console.error(err)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return undefined
    }

    const loadTimer = setTimeout(() => {
      fetchItems()
      fetchPendingClaims()
    }, 0)
    return () => clearTimeout(loadTimer)
  }, [fetchItems, fetchPendingClaims, navigate, user])

  async function updateStatus(id, status) {
    await updateDoc(doc(db, 'items', id), { status })
    setItems(prev => prev.map(item => item.id === id ? { ...item, status } : item))
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, 'items', id))
    setItems(prev => prev.filter(item => item.id !== id))
  }

  async function handleEdit(id, updates) {
    await updateDoc(doc(db, 'items', id), updates)
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
  }

  const acceptClaim = async (claim) => {
    await updateDoc(doc(db, 'claims', claim.id), { status: 'accepted' })
    await updateDoc(doc(db, 'items', claim.itemId), { status: 'resolved' })
    await addDoc(collection(db, 'notifications'), {
      toUid: claim.claimedBy,
      fromEmail: user.email,
      itemId: claim.itemId,
      itemTitle: claim.itemTitle,
      type: 'claim_accepted',
      message: 'Your claim was accepted! You can now chat with the owner.',
      read: false,
      createdAt: serverTimestamp(),
    })
    await addDoc(collection(db, 'chatRooms'), {
      participants: [user.uid, claim.claimedBy],
      participantEmails: [user.email, claim.claimedByEmail],
      itemId: claim.itemId,
      itemTitle: claim.itemTitle,
      claimId: claim.id,
      createdAt: serverTimestamp(),
    })

    setPendingClaims(prev => prev.filter(currentClaim => currentClaim.id !== claim.id))
    setItems(prev => prev.map(item => item.id === claim.itemId ? { ...item, status: 'resolved' } : item))
  }

  const rejectClaim = async (claim) => {
    await updateDoc(doc(db, 'claims', claim.id), { status: 'rejected' })
    await addDoc(collection(db, 'notifications'), {
      toUid: claim.claimedBy,
      fromEmail: user.email,
      itemId: claim.itemId,
      itemTitle: claim.itemTitle,
      type: 'claim_rejected',
      message: 'Your claim was not accepted.',
      read: false,
      createdAt: serverTimestamp(),
    })

    setPendingClaims(prev => prev.filter(currentClaim => currentClaim.id !== claim.id))
  }

  const myFound = items.filter(item => item.type === 'found')
  const myLost = items.filter(item => item.type === 'lost')
  const totalActive = items.filter(item => item.status === 'active').length
  const totalResolved = items.length - totalActive
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0]

  if (loading) {
    return (
      <div className="empty-state">
        Loading profile...
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-sm">
        <div className="empty-state">
          <p className="heading-md mb-1">Failed to load your items</p>
          <button onClick={fetchItems} className="btn btn-primary">
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-sm">
      <div style={{
        height: '3px',
        background: 'linear-gradient(90deg, #7C3AED, #059669)',
        borderRadius: '999px',
        marginBottom: '1.5rem',
      }} />
      <div className="mb-4">
        <h2 className="heading-lg mb-1" style={{ color: '#111', fontSize: 'clamp(2rem, 5vw, 2.7rem)' }}>
          Hi, {firstName} 👋
        </h2>
        <p className="text-sm text-light fw-500">
          {user.email}
        </p>
      </div>

      <div className="profile-stats-container">
        <div className="profile-stat-box" style={{ borderTop: 'none', borderColor: '#7C3AED' }} >
          <p className="profile-stat-val" style={{ color: '#7C3AED' }}>
            {items.length}
          </p>
          <p className="profile-stat-lbl">
            Total Posted
          </p>
        </div>
        <div className="profile-stat-box stat-active">
          <p className="profile-stat-val stat-active-text" style={{ color: '#d97706' }}>
            {totalActive}
          </p>
          <p className="profile-stat-lbl">
            Active
          </p>
        </div>
        <div className="profile-stat-box stat-resolved">
          <p className="profile-stat-val stat-resolved-text" style={{ color: '#059669' }}>
            {totalResolved}
          </p>
          <p className="profile-stat-lbl">
            Resolved
          </p>
        </div>
      </div>

      <Section
        title="Claims on My Items"
        items={pendingClaims}
        emptyMessage="No pending claims on your items."
      >
        {pendingClaims.map(claim => (
          <ClaimRow
            key={claim.id}
            claim={claim}
            onAccept={acceptClaim}
            onReject={rejectClaim}
          />
        ))}
      </Section>

      <Section
        title="Items I Found"
        items={myFound}
        emptyMessage="You haven't reported any found items yet."
      >
        {myFound.map(item => (
          <ItemRow
            key={item.id}
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMarkReturned={id => updateStatus(id, 'returned')}
            onMarkReclaimed={id => updateStatus(id, 'reclaimed')}
          />
        ))}
      </Section>

      <Section
        title="Items I Lost"
        items={myLost}
        emptyMessage="You haven't reported any lost items yet."
      >
        {myLost.map(item => (
          <ItemRow
            key={item.id}
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMarkReturned={id => updateStatus(id, 'returned')}
            onMarkReclaimed={id => updateStatus(id, 'reclaimed')}
          />
        ))}
      </Section>

      {items.length === 0 && (
        <Link to="/post" className="btn btn-primary">
          + Post an Item
        </Link>
      )}
    </div>
  )
}

export default Profile
