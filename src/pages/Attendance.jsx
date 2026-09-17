import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const th = { background: '#2a2220', color: '#e8c84a', padding: '9px 12px', textAlign: 'left', fontSize: '12px', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }

export default function Attendance() {
  const [members, setMembers] = useState([])
  const [events, setEvents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [eventFilter, setEventFilter] = useState('all')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [{ data: m }, { data: e }, { data: a }] = await Promise.all([
      supabase.from('profiles').select('id, name, team, status, dual_team').eq('status', 'active').order('team').order('name'),
      supabase.from('events').select('id, category, event_type, event_date'),
      supabase.from('attendance').select('*'),
    ])
    if (m) setMembers(m)
    if (e) setEvents(e)
    if (a) setAttendance(a)
    setLoading(false)
  }

  const filteredEvents = events.filter(e => {
    if (eventFilter === 'match') return ['公式戦','フレンドリー','カップ戦','遠征'].includes(e.event_type)
    if (eventFilter === 'practice') return e.event_type === '練習' || e.event_type === '合同練習'
    return true
  })

  // その人自身のメインカテゴリー（team列）のイベント＋合同イベントを分母にする。
  // 兼務（dual_team）でも「両チーム分」は数えず、あくまで本人のメインチームのイベント数のみを対象とする（2026-09-17再修正、芦田さんの指示による）。
  // 「全員」タブで見ているときも、他チームのイベント数を分母に含めてしまわないようにするための修正（2026-09-17）。
  const calcRate = (member) => {
    const memberEvents = filteredEvents.filter(e => e.category === 'joint' || e.category === member.team)
    if (memberEvents.length === 0) return { rate: 0, present: 0, total: 0 }
    const present = attendance.filter(a => a.member_id === member.id && memberEvents.map(e => e.id).includes(a.event_id) && a.status === 'present').length
    return { rate: Math.round((present / memberEvents.length) * 100), present, total: memberEvents.length }
  }

  const filteredMembers = members.filter(m => filter === 'all' || m.team === filter)
  const membersWithRate = filteredMembers.map(m => ({ ...m, ...calcRate(m) })).sort((a, b) => b.rate - a.rate)
  const u40Members = membersWithRate.filter(m => m.team === 'u40')
  const o40Members = membersWithRate.filter(m => m.team === 'o40')

  const totalEvents = filteredEvents.filter(e => filter === 'all' || e.category === filter || e.category === 'joint').length
  // 「全員」タブでの「対象イベント数」表示用（U-40/O-40それぞれの分母をそのまま見せる。合同イベントは両方に含む）
  const u40EventCount = filteredEvents.filter(e => e.category === 'joint' || e.category === 'u40').length
  const o40EventCount = filteredEvents.filter(e => e.category === 'joint' || e.category === 'o40').length
  const avgRate = (list) => list.length === 0 ? 0 : Math.round(list.reduce((s, m) => s + m.rate, 0) / list.length)

  const pctColor = (r) => r >= 70 ? '#27ae60' : r >= 50 ? '#f39c12' : '#e74c3c'

  const tabStyle = (val) => ({
    padding: '6px 16px', borderRadius: '20px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer', border: '2px solid',
    borderColor: filter === val ? (val === 'u40' ? '#7b5ea7' : val === 'o40' ? '#2a5fa5' : '#2a2220') : '#ccc',
    background: filter === val ? (val === 'u40' ? '#7b5ea7' : val === 'o40' ? '#2a5fa5' : '#2a2220') : 'transparent',
    color: filter === val ? 'white' : '#8a7f7a',
  })

  const AttendList = ({ list, color, title }) => (
    <div style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: '18px' }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '1px', color: '#2a2220', marginBottom: '14px' }}>
        <span style={{ color }}>■</span> {title}
        <span style={{ fontSize: '12px', color: '#8a7f7a', fontWeight: 'normal', fontFamily: 'inherit', marginLeft: '10px' }}>平均 {avgRate(list)}%</span>
      </div>
      {list.length === 0 ? <div style={{ color: '#8a7f7a', fontSize: '13px' }}>データがありません</div> :
        list.map((m, i) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < list.length - 1 ? '1px solid #f0ebe5' : 'none', fontSize: '13px' }}>
            <div style={{ width: '130px', fontWeight: '500', flexShrink: 0 }}>{m.name}</div>
            <div style={{ flex: 1, background: '#e8e0d8', borderRadius: '99px', height: '7px', overflow: 'hidden' }}>
              <div style={{ width: `${m.rate}%`, height: '100%', background: pctColor(m.rate), borderRadius: '99px', transition: 'width .3s' }} />
            </div>
            <div style={{ width: '40px', textAlign: 'right', fontWeight: '700', fontSize: '12.5px', color: pctColor(m.rate), flexShrink: 0 }}>{m.rate}%</div>
            <div style={{ width: '55px', textAlign: 'right', fontSize: '11px', color: '#8a7f7a', flexShrink: 0 }}>{m.present}/{m.total}回</div>
          </div>
        ))
      }
    </div>
  )

  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '2px', color: '#2a2220', marginBottom: '20px' }}>
        出席率ダッシュボード
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={tabStyle('all')} onClick={() => setFilter('all')}>全員</div>
          <div style={tabStyle('u40')} onClick={() => setFilter('u40')}>U-40</div>
          <div style={tabStyle('o40')} onClick={() => setFilter('o40')}>O-40</div>
        </div>
        <select value={eventFilter} onChange={e => setEventFilter(e.target.value)}
          style={{ padding: '6px 12px', border: '1.5px solid #e0dbd5', borderRadius: '20px', fontSize: '12.5px', fontWeight: '600', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <option value="all">全イベント</option>
          <option value="match">試合のみ</option>
          <option value="practice">練習のみ</option>
        </select>
      </div>

      {loading ? <div style={{ color: '#8a7f7a', fontSize: '13px' }}>読み込み中...</div> : (
        <>
          <div className="grid-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '20px' }}>
            <div style={{ background: 'white', borderRadius: '10px', padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderTop: '3px solid #e8c84a' }}>
              {filter === 'all' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', color: '#7b5ea7', lineHeight: 1 }}>{u40EventCount}</div>
                    <div style={{ fontSize: '11px', color: '#8a7f7a', marginRight: '4px' }}>U-40</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', color: '#2a5fa5', lineHeight: 1 }}>{o40EventCount}</div>
                    <div style={{ fontSize: '11px', color: '#8a7f7a' }}>O-40</div>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#8a7f7a', marginTop: '3px' }}>対象イベント数（合同含む）</div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '36px', color: '#e8c84a', lineHeight: 1 }}>{totalEvents}</div>
                  <div style={{ fontSize: '11.5px', color: '#8a7f7a', marginTop: '3px' }}>対象イベント数</div>
                </>
              )}
            </div>
            {[
              [membersWithRate.filter(m => m.rate >= 70).length, '出席率70%以上', '#27ae60'],
              [membersWithRate.filter(m => m.rate < 50).length, '出席率50%未満', '#e74c3c'],
            ].map(([val, label, color], i) => (
              <div key={i} style={{ background: 'white', borderRadius: '10px', padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderTop: `3px solid ${color}` }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '36px', color, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: '11.5px', color: '#8a7f7a', marginTop: '3px' }}>{label}</div>
              </div>
            ))}
          </div>

          {filter === 'all' ? (
            <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
              <AttendList list={u40Members} color="#7b5ea7" title="U-40" />
              <AttendList list={o40Members} color="#2a5fa5" title="O-40" />
            </div>
          ) : (
            <AttendList list={membersWithRate} color={filter === 'u40' ? '#7b5ea7' : '#2a5fa5'} title={filter === 'u40' ? 'U-40' : 'O-40'} />
          )}
        </>
      )}
    </div>
  )
}
