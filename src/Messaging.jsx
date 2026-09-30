import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import { supabase } from './lib/supabaseClient'

export async function startConversation(propertyId, agentId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  const { data: existing } = await supabase
    .from('conversations').select('*')
    .eq('property_id', propertyId).eq('student_id', user.id).eq('agent_id', agentId).maybeSingle()
  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('conversations').insert({ property_id: propertyId, student_id: user.id, agent_id: agentId }).select().single()
  if (error) throw error
  return created.id
}

export function ConversationsList({ onSelect }) {
  const [conversations, setConversations] = useState([])
  const [status, setStatus] = useState('Loading...')
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus('Not logged in'); return }
      setUserId(user.id)
      const { data, error } = await supabase
        .from('conversations')
        .select('*, properties(title), student:profiles!conversations_student_id_fkey(full_name), agent:profiles!conversations_agent_id_fkey(full_name)')
        .or(`student_id.eq.${user.id},agent_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
      if (error) { setStatus(error.message); return }
      setConversations(data)
      setStatus('')
    }
    load()
  }, [])

  return (
    <div className="page-wrap" style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 22, margin: '0 0 4px' }}>Messages</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 20px' }}>Conversations with agents and students</p>

      {conversations.length === 0 ? (
        <div className="empty-state">{status || 'No conversations yet. Message an agent from a listing to start one.'}</div>
      ) : (
        <div className="menu-list">
          {conversations.map(c => {
            const otherName = c.student_id === userId ? c.agent?.full_name : c.student?.full_name
            return (
              <div key={c.id} className="convo-row" onClick={() => onSelect(c.id)}>
                <div className="convo-avatar">{(otherName || '?').slice(0, 2).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{otherName || 'User'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.properties?.title || 'Property'}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ChatWindow({ conversationId, onBack }) {
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [userId, setUserId] = useState(null)
  const [header, setHeader] = useState({ name: 'Conversation', property: '' })
  const bodyRef = useRef(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id)

      const { data: convo } = await supabase
        .from('conversations')
        .select('*, properties(title), student:profiles!conversations_student_id_fkey(full_name), agent:profiles!conversations_agent_id_fkey(full_name)')
        .eq('id', conversationId)
        .single()

      if (convo) {
        const otherName = convo.student_id === user.id ? convo.agent?.full_name : convo.student?.full_name
        setHeader({ name: otherName || 'User', property: convo.properties?.title || '' })
      }

      const { data } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true })
      setMessages(data || [])
    }
    load()

    const channel = supabase.channel(`messages-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        payload => setMessages(prev => [...prev, payload.new]))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  useEffect(() => { bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight) }, [messages])

  async function sendMessage(e) {
    e.preventDefault()
    if (!content.trim()) return
    await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: userId, content })
    setContent('')
  }

  return (
    <div className="page-wrap" style={{ maxWidth: 560 }}>
      <div className="chat-window">
        <div className="chat-header">
          <button className="btn-outline" style={{ padding: 6 }} onClick={onBack}><ArrowLeft size={16} /></button>
          <div>
            <div>{header.name}</div>
            {header.property && <div style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>{header.property}</div>}
          </div>
        </div>
        <div className="chat-body" ref={bodyRef}>
          {messages.map(m => (
            <div key={m.id} className={`bubble ${m.sender_id === userId ? 'mine' : 'theirs'}`}>{m.content}</div>
          ))}
        </div>
        <form className="chat-input-row" onSubmit={sendMessage}>
          <input value={content} onChange={e => setContent(e.target.value)} placeholder="Type a message..." />
          <button type="submit" style={{ padding: '0 14px' }}><Send size={16} /></button>
        </form>
      </div>
    </div>
  )
}
