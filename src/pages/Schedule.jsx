import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Schedule() {
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [pastEvents, setPastEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [attending, setAttending] = useState({})
  const [attendanceCounts, setAttendanceCounts] = useState({})
  const [modal, setModal] = useState(null)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('present')
  const [userId, setUserId] = useState(null)
  const [showPast, setShowPast] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        fetchEvents(user.id)
      }
    })
  }, [])

  const fetchEvents = async (uid) => {
    const today = new Date().toISOString().split('T')[0]
    const { data: upcoming } = await supabase.from('events').select('*').gte('event_date', today).order('event_date')
    const { data: past } = await supabase.from('events').select('*').lt('event_date', today).order('event_date', { ascending: false }).limit(10)
    if (upcoming) setUpcomingEvents(upcoming)
    if (past) setPastEvents(past)
    const allIds = [...(upcoming || []), ...(past || [])].map(e => e.id)
    if (allIds.length > 0) {
      fetchMyAttendance(uid, allIds)
      fetchAttendanceCounts(allIds)
    }
    setLoading(false)
  }

  const fetchMyAttendance = async (uid, eventIds) => {
    const { data } = await supabase.from('attendance').select('*').eq('member_id', uid).in('event_id', eventIds)
    if (data) {
      const map = {}
      data.forEach(a => { map[a.event_id] = a })
      setAttending(map)
    }
  }

  const fetchAttendanceCounts = async (eventIds) => {
    const { data } = await supabase.from('attendance').select('event_id, status').in('event_id', eventIds)
    if (data) {
      const counts = {}
      eventIds.forEach(id => { counts[id] = { present: 0, absent: 0, undecided: 0, late: 0, early_leave: 0 } })
      data.forEach(a => {
        if (counts[a.event_id]) {
          counts[a.event_id][a.status] = (counts[a.event_id][a.status] || 0) + 1
        }
      })
      setAttendanceCounts(counts)
    }
  }

  const handleAttend = async () => {
    if (!modal || !userId) return
    const existing = attending[modal.id]
    if (existing) {
      await supabase.from('attendance').update({ status, comment }).eq('id', existing.id)
    } else {
      await supabase.from('attendance').insert({ event_id: modal.id, member_id: userId, status, comment })
    }
    const allIds = [...upcomingEvents, ...pastEvents].map(e => e.id)
    fetchMyAttendance(userId, allIds)
    fetchAttendanceCounts(allIds)
    setModal(null)
    setComment('')
    setStatus('present')
  }

  const statusLabel = (s) => {
    const map = { present: '✅ 出席', absent: '❌ 欠席', late: '⏰ 遅刻', early_leave: '🚪 早退', undecided: '❓ 未定' }
    return map[s] || s
  }

  const catInfo = (cat) => {
    if (cat === 'u40') return { label: 'U-40', color: '#7b5ea7', bg: '#ede8f7' }
    if (cat === 'o40') return { label: 'O-40', color: '#2a5fa5', bg: '#dceeff' }
    return { label: '合同', color: '#e8a020', bg: '#fef3e2' }
  }

  const applyFilter = (evs) => evs.filter(e => filter === 'all' || e.category === filter)

  const tabStyle = (val) => ({
    padding: '6px 16px', borderRadius: '20px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer', border: '2px solid',
    borderColor: filter === val ? (val === 'u40' ? '#7b5ea7' : val === 'o40' ? '#2a5fa5' : val === 'joint' ? '#e8a020' : '#2a2220') : '#ccc',
    background: filter === val ? (val === 'u40' ? '#7b5ea7' : val === 'o40' ? '#2a5fa5' : val === 'joint' ? '#e8a020' : '#2a2220') : 'transparent',
    color: filter === val ? 'white' : '#8a7f7a',
  })

  const EventCard = ({ ev, isPast }) => {
    const cat = catInfo(ev.category)
    const d = new Date(ev.event_date)
    const att = attending[ev.id]
    const counts = attendanceCounts[ev.id] || {}
    const totalResponded = (counts.present || 0) + (counts.absent || 0) + (counts.late || 0) + (counts.early_leave || 0) + (counts.undecided || 0)

    return (
      <div style={{
        background: isPast ? '#fafafa' : 'white', borderRadius: '8px', padding: '13px 16px',
        marginBottom: '9px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        borderLeft: `4px solid ${isPast ? '#ccc' : '#e8c84a'}`, opacity: isPast ? 0.75 : 1
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'center', minWidth: '40px' }}>
            <div style={{ fontSize: '24px', fontFamily: 'serif', lineHeight: 1, color: isPast ? '#aaa' : '#2a2220' }}>{d.getDate()}</div>
            <div style={{ fontSize: '9.5px', color: '#8a7f7a', textTransform: 'uppercase' }}>
              {d.toLocaleString('en', { month: 'short' })}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', fontSize: '13.5px', color: isPast ? '#888' : '#2a2220' }}>{ev.title}</div>
            <div style={{ fontSize: '11.5px', color: '#8a7f7a', marginTop: '2px' }}>
              📍 {ev.venue || '未定'}　⏰ KO {ev.kickoff_time ? ev.kickoff_time.slice(0,5) : '未定'}
              {ev.meetup_time && `　集合 ${ev.meetup_time.slice(0,5)}`}
            </div>
            {ev.meetup_place && <div style={{ fontSize: '11px', color: '#8a7f7a' }}>🚩 {ev.meetup_place}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
            <span style={{ background: cat.bg, color: cat.color, fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px' }}>
              {cat.label}
            </span>
            {!isPast && (att ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#27ae60', fontWeight: '600' }}>{statusLabel(att.status)}</span>
                <button onClick={() => { setModal(ev); setStatus(att.status); setComment(att.comment || '') }}
                  style={{ padding: '4px 9px', background: 'transparent', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '11.5px', cursor: 'pointer' }}>変更</button>
              </div>
            ) : (
              <button onClick={() => { setModal(ev); setStatus('present'); setComment('') }}
                style={{ padding: '5px 10px', background: '#e8c84a', color: '#2a2220', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>出欠登録</button>
            ))}
            {isPast && att && <span style={{ fontSize: '11px', color: '#8a7f7a' }}>{statusLabel(att.status)}</span>}
          </div>
        </div>

        {/* 出欠カウント */}
        {totalResponded > 0 && (
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f0ebe5', display: 'flex', gap: '12px', fontSize: '12px' }}>
            <span style={{ color: '#27ae60', fontWeight: '600' }}>✅ 参加 {(counts.present || 0) + (counts.late || 0) + (counts.early_leave || 0)}名</span>
            <span style={{ color: '#e74c3c', fontWeight: '600' }}>❌ 欠席 {counts.absent || 0}名</span>
            <span style={{ color: '#8a7f7a' }}>❓ 未定 {counts.undecided || 0}名</span>
          </div>
        )}
      </div>
    )
  }

  const Section = ({ title, color, evs, isPast }) => {
    if (evs.length === 0) return null
    return (
      <div style={{ marginBottom: '22px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color, marginBottom: '10px', letterSpacing: '1px' }}>■ {title}</div>
        {evs.map(ev => <EventCard key={ev.id} ev={ev} isPast={isPast} />)}
      </div>
    )
  }

  const filteredUpcoming = applyFilter(upcomingEvents)
  const filteredPast = applyFilter(pastEvents)
  const upG = { u40: filteredUpcoming.filter(e => e.category === 'u40'), o40: filteredUpcoming.filter(e => e.category === 'o40'), joint: filteredUpcoming.filter(e => e.category === 'joint') }
  const paG = { u40: filteredPast.filter(e => e.category === 'u40'), o40: filteredPast.filter(e => e.category === 'o40'), joint: filteredPast.filter(e => e.category === 'joint') }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2a2220', letterSpacing: '2px', marginBottom: '20px' }}>スケジュール・出欠</div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[['all','全体'],['u40','U-40'],['o40','O-40'],['joint','合同']].map(([v,l]) => (
          <div key={v} style={tabStyle(v)} onClick={() => setFilter(v)}>{l}</div>
        ))}
      </div>

      {loading ? <div style={{ color: '#8a7f7a', fontSize: '13px' }}>読み込み中...</div> : (
        <>
          {filteredUpcoming.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '10px', padding: '24px', textAlign: 'center', color: '#8a7f7a', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: '16px' }}>
              今後の予定はありません
            </div>
          ) : filter === 'all' ? (
            <>
              <Section title="U-40" color="#7b5ea7" evs={upG.u40} isPast={false} />
              <Section title="O-40" color="#2a5fa5" evs={upG.o40} isPast={false} />
              <Section title="合同イベント" color="#e8a020" evs={upG.joint} isPast={false} />
            </>
          ) : filteredUpcoming.map(ev => <EventCard key={ev.id} ev={ev} isPast={false} />)}

          {filteredPast.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div onClick={() => setShowPast(!showPast)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: '#e0dbd5' }} />
                <span style={{ fontSize: '12px', color: '#8a7f7a', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  {showPast ? '▲' : '▼'} 過去のイベント（{filteredPast.length}件）
                </span>
                <div style={{ flex: 1, height: '1px', background: '#e0dbd5' }} />
              </div>
              {showPast && (filter === 'all' ? (
                <>
                  <Section title="U-40" color="#aaa" evs={paG.u40} isPast={true} />
                  <Section title="O-40" color="#aaa" evs={paG.o40} isPast={true} />
                  <Section title="合同イベント" color="#aaa" evs={paG.joint} isPast={true} />
                </>
              ) : filteredPast.map(ev => <EventCard key={ev.id} ev={ev} isPast={true} />))}
            </div>
          )}
        </>
      )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={() => setModal(null)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '26px', width: '440px', maxWidth: '92vw', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '14px' }}>📅 出欠登録</div>
            <div style={{ fontWeight: '600', marginBottom: '6px' }}>{modal.title}</div>
            <div style={{ fontSize: '12.5px', color: '#8a7f7a', marginBottom: '16px' }}>
              📅 {modal.event_date}　⏰ {modal.kickoff_time ? modal.kickoff_time.slice(0,5) : '未定'}　📍 {modal.venue || '未定'}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#8a7f7a', display: 'block', marginBottom: '4px' }}>出欠</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e0dbd5', borderRadius: '6px', fontSize: '13px' }}>
                <option value="present">✅ 出席</option>
                <option value="absent">❌ 欠席</option>
                <option value="late">⏰ 遅刻</option>
                <option value="early_leave">🚪 早退</option>
                <option value="undecided">❓ 未定</option>
              </select>
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#8a7f7a', display: 'block', marginBottom: '4px' }}>コメント（任意）</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="例：15分遅れます" rows={2}
                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e0dbd5', borderRadius: '6px', fontSize: '13px', resize: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '9px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '8px 16px', background: 'transparent', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>キャンセル</button>
              <button onClick={handleAttend} style={{ padding: '8px 16px', background: '#e8c84a', color: '#2a2220', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>登録する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
