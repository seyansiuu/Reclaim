import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, where } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

function ItemDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [claim, setClaim] = useState(null)
  const [claimMessage, setClaimMessage] = useState('')
  const [showClaimForm, setShowClaimForm] = useState(false)
  const [claimLoading, setClaimLoading] = useState(true)
  const [claimSubmitting, setClaimSubmitting] = useState(false)
  const [claimError, setClaimError] = useState('')
  const [chatRoomId, setChatRoomId] = useState('')

  const fetchItem = useCallback(async () => {
    await Promise.resolve()

    setLoading(true)
    try {
      const snapshot = await getDoc(doc(db, 'items', id))
      setItem(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null)
    } catch (err) {
      console.error(err)
      setItem(null)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      fetchItem()
    }, 0)
    return () => clearTimeout(loadTimer)
  }, [fetchItem])

  useEffect(() => {
    const fetchExistingClaim = async () => {
      await Promise.resolve()

      const user = auth.currentUser
      setClaim(null)
      setClaimLoading(true)

      if (!user || !item) {
        setClaimLoading(false)
        return
      }

      try {
        const claimsQuery = query(
          collection(db, 'claims'),
          where('itemId', '==', id),
          where('claimedBy', '==', user.uid)
        )
        const snapshot = await getDocs(claimsQuery)
        if (!snapshot.empty) {
          const claimDoc = snapshot.docs[0]
          setClaim({ id: claimDoc.id, ...claimDoc.data() })
        }
      } catch (err) {
        console.error(err)
        setClaimError('Could not load your claim status right now.')
      }
      setClaimLoading(false)
    }

    const loadTimer = setTimeout(() => {
      fetchExistingClaim()
    }, 0)
    return () => clearTimeout(loadTimer)
  }, [id, item])

  useEffect(() => {
    const fetchChatRoom = async () => {
      await Promise.resolve()

      const user = auth.currentUser
      setChatRoomId('')

      if (!user || claim?.status !== 'accepted') return

      try {
        const chatRoomsQuery = query(
          collection(db, 'chatRooms'),
          where('participants', 'array-contains', user.uid),
          where('itemId', '==', id)
        )
        const snapshot = await getDocs(chatRoomsQuery)
        if (!snapshot.empty) {
          setChatRoomId(snapshot.docs[0].id)
        }
      } catch (err) {
        console.error(err)
      }
    }

    const loadTimer = setTimeout(() => {
      fetchChatRoom()
    }, 0)
    return () => clearTimeout(loadTimer)
  }, [claim, id])

  function copyEmail() {
    navigator.clipboard.writeText(item.postedByEmail)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  const handleClaimSubmit = async (e) => {
    e.preventDefault()

    const user = auth.currentUser
    const message = claimMessage.trim()

    if (!user) {
      navigate('/login')
      return
    }

    if (!message) {
      setClaimError('Please describe your claim before submitting.')
      return
    }

    setClaimSubmitting(true)
    setClaimError('')

    try {
      const claimDoc = {
        itemId: id,
        itemTitle: item.title,
        itemType: item.type,
        itemPostedBy: item.postedBy,
        itemPostedByEmail: item.postedByEmail,
        claimedBy: user.uid,
        claimedByEmail: user.email,
        message,
        status: 'pending',
        createdAt: serverTimestamp(),
      }

      const newClaimRef = await addDoc(collection(db, 'claims'), claimDoc)
      await addDoc(collection(db, 'notifications'), {
        toUid: item.postedBy,
        fromEmail: user.email,
        itemId: id,
        itemTitle: item.title,
        type: 'claim',
        message: `${user.email} claimed your item "${item.title}"`,
        read: false,
        createdAt: serverTimestamp(),
      })

      setClaim({ id: newClaimRef.id, ...claimDoc, createdAt: new Date() })
      setClaimMessage('')
      setShowClaimForm(false)
    } catch (err) {
      console.error(err)
      setClaimError('Could not submit your claim. Please try again.')
    }
    setClaimSubmitting(false)
  }

  if (loading) {
    return (
      <div className="empty-state">
        Loading details...
      </div>
    )
  }

  if (!item) {
    return (
      <div className="empty-state">
        Item not found.
      </div>
    )
  }

  const user = auth.currentUser
  const isOwner = user?.uid === item.postedBy
  const canShowClaimArea = user && !isOwner
  const canStartClaim = canShowClaimArea && item.status === 'active'
  const claimButtonLabel = item.type === 'lost' ? 'I Found This Item' : 'This is Mine'

  return (
    <div className="container-sm details-page">
      <button
        onClick={() => navigate('/browse')}
        className="btn-back mb-3"
      >
        Back to Browse
      </button>

      {item.imageUrl && (
        <div className="details-image">
          <img src={item.imageUrl} alt={item.title} />
        </div>
      )}

      <div className="mb-4">
        <div className="flex align-center gap-sm mb-2">
          <span className={`badge ${item.type === 'lost' ? 'lost' : 'found'}`}>
            {item.type === 'lost' ? 'Lost' : 'Found'}
          </span>
          <span className={`badge ${item.status === 'active' ? 'active' : 'returned'}`}>
            {item.status === 'active' ? 'Active' : 'Resolved'}
          </span>
          {item.category && (
            <span className="badge neutral">
              {item.category}
            </span>
          )}
        </div>

        <h1 className="heading-lg mb-1">
          {item.title}
        </h1>

        <div className="flex gap-lg">
          <span className="text-sm text-light fw-500">
            {item.location}
          </span>
          <span className="text-sm text-light fw-500">
            {item.date}
          </span>
        </div>
      </div>

      <hr className="details-divider" />

      <div className="mb-4">
        <p className="details-section-title">
          Description
        </p>
        <p className="details-desc">
          {item.description}
        </p>
      </div>

      {canShowClaimArea && (
        <div className="details-contact-panel mb-4">
          {claimLoading ? (
            <p className="text-sm text-muted" style={{ margin: 0 }}>Checking claim status...</p>
          ) : claim ? (
            <>
              <p className="text-sm text-muted" style={{ marginTop: 0 }}>
                {claim.status === 'pending'
                  ? 'Claim submitted. Waiting for the poster to respond.'
                  : `Your claim status: ${claim.status}`}
              </p>
              {claim.status === 'accepted' && chatRoomId && (
                <button
                  onClick={() => navigate(`/chat/${chatRoomId}`)}
                  className="btn btn-primary"
                >
                  Open Chat
                </button>
              )}
            </>
          ) : canStartClaim && showClaimForm ? (
            <form onSubmit={handleClaimSubmit} className="flex flex-col gap-sm">
              <label htmlFor="claim-message" className="form-label">
                Describe your claim
              </label>
              <textarea
                id="claim-message"
                value={claimMessage}
                onChange={(e) => setClaimMessage(e.target.value)}
                placeholder="Share details that help the poster verify your claim."
                rows={4}
                className="input-field"
              />
              {claimError && (
                <p className="text-sm" style={{ color: '#cc0000', margin: 0 }}>
                  {claimError}
                </p>
              )}
              <div className="flex gap-sm flex-wrap">
                <button
                  type="submit"
                  disabled={claimSubmitting}
                  className="btn btn-primary"
                >
                  {claimSubmitting ? 'Submitting...' : 'Submit Claim'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowClaimForm(false)
                    setClaimError('')
                  }}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : canStartClaim ? (
            <>
              {claimError && (
                <p className="text-sm" style={{ color: '#cc0000' }}>
                  {claimError}
                </p>
              )}
              <button
                onClick={() => setShowClaimForm(true)}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {claimButtonLabel}
              </button>
            </>
          ) : null}
        </div>
      )}

      <div className="details-contact-panel">
        <p className="details-section-title">
          Contact the Poster
        </p>

        <div className="flex flex-between align-center mb-3 flex-wrap gap-md">
          <div>
            <p className="contact-label">
              Email
            </p>
            <p className="contact-email">
              {item.postedByEmail}
            </p>
          </div>

          <button
            onClick={copyEmail}
            className={`btn ${copied ? 'btn-secondary copied-btn' : 'btn-outline'}`}
          >
            {copied ? 'Copied' : 'Copy Email'}
          </button>
        </div>

        <a
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-btn mt-1"
          href={`https://wa.me/?text=Hi, I saw your post on Reclaim about "${item.title}". I think I can help!`}
        >
          Message on WhatsApp
        </a>
      </div>
    </div>
  )
}

export default ItemDetails
