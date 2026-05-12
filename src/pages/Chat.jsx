import { useEffect, useRef, useState } from 'react'
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { useNavigate, useParams } from 'react-router-dom'

function Chat() {
  const { chatRoomId } = useParams()
  const navigate = useNavigate()
  const user = auth.currentUser
  const bottomRef = useRef(null)
  const [chatRoom, setChatRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const fetchChatRoom = async () => {
      if (!user) {
        navigate('/login')
        return
      }

      try {
        const chatRoomSnap = await getDoc(doc(db, 'chatRooms', chatRoomId))
        if (!chatRoomSnap.exists()) {
          navigate('/browse')
          return
        }

        const nextChatRoom = { id: chatRoomSnap.id, ...chatRoomSnap.data() }
        if (!nextChatRoom.participants?.includes(user.uid)) {
          navigate('/browse')
          return
        }

        setChatRoom(nextChatRoom)
      } catch (err) {
        console.error(err)
        navigate('/browse')
      } finally {
        setLoading(false)
      }
    }

    fetchChatRoom()
  }, [chatRoomId, navigate, user])

  useEffect(() => {
    if (!chatRoom) return undefined

    const messagesQuery = query(
      collection(db, 'chatRooms', chatRoomId, 'messages'),
      orderBy('createdAt', 'asc')
    )

    return onSnapshot(messagesQuery, (snapshot) => {
      setMessages(snapshot.docs.map(messageDoc => ({ id: messageDoc.id, ...messageDoc.data() })))
    }, (err) => {
      console.error(err)
    })
  }, [chatRoom, chatRoomId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    const trimmedText = text.trim()

    if (!trimmedText || !user) return

    setSending(true)
    try {
      await addDoc(collection(db, 'chatRooms', chatRoomId, 'messages'), {
        text: trimmedText,
        senderUid: user.uid,
        senderEmail: user.email,
        createdAt: serverTimestamp(),
      })
      setText('')
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return ''
    return timestamp.toDate().toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return <p style={{ padding: '3rem 2rem', color: '#999' }}>Loading chat...</p>
  }

  if (!chatRoom) return null

  const otherEmail = chatRoom.participantEmails?.find(email => email !== user?.email) || 'Unknown participant'

  return (
    <div style={{
      maxWidth: '600px',
      margin: '2rem auto',
      padding: '0 1rem',
      minHeight: 'calc(100vh - 120px)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        borderBottom: '1px solid #eee',
        paddingBottom: '1rem',
        marginBottom: '1rem',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#888',
            fontSize: '0.86rem',
            padding: 0,
            marginBottom: '0.8rem',
          }}
        >
          ← Back
        </button>
        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#111', margin: '0 0 0.25rem' }}>
          Chat about: {chatRoom.itemTitle}
        </h2>
        <p style={{ color: '#777', fontSize: '0.86rem', margin: 0, wordBreak: 'break-word' }}>
          {otherEmail}
        </p>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9rem',
        overflowY: 'auto',
        paddingBottom: '1rem',
      }}>
        {messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', fontSize: '0.9rem', marginTop: '2rem' }}>
            No messages yet.
          </p>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderUid === user?.uid

            return (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isOwn ? 'flex-end' : 'flex-start',
                }}
              >
                <p style={{
                  fontSize: '0.72rem',
                  color: '#888',
                  margin: '0 0 0.25rem',
                  maxWidth: '78%',
                  wordBreak: 'break-word',
                }}>
                  {message.senderEmail}
                </p>
                <div style={{
                  maxWidth: '78%',
                  padding: '0.7rem 0.85rem',
                  borderRadius: '12px',
                  background: isOwn ? '#111' : '#f1f1f1',
                  color: isOwn ? '#fff' : '#222',
                  fontSize: '0.92rem',
                  lineHeight: '1.45',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {message.text}
                </div>
                <p style={{
                  fontSize: '0.7rem',
                  color: '#aaa',
                  margin: '0.25rem 0 0',
                  maxWidth: '78%',
                }}>
                  {formatTime(message.createdAt)}
                </p>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        style={{
          display: 'flex',
          gap: '0.6rem',
          borderTop: '1px solid #eee',
          paddingTop: '1rem',
          background: '#fff',
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            minWidth: 0,
            border: '1.5px solid #e0e0e0',
            borderRadius: '10px',
            padding: '0.75rem 0.9rem',
            fontSize: '0.92rem',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          style={{
            border: 'none',
            borderRadius: '10px',
            background: sending || !text.trim() ? '#777' : '#111',
            color: '#fff',
            padding: '0 1rem',
            fontSize: '0.9rem',
            fontWeight: '700',
            cursor: sending || !text.trim() ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default Chat
