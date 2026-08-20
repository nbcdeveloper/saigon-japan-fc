import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

// UTCではなくローカル時間（ベトナム時間）基準で「今日」の日付文字列を作る
const todayLocalStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Schedule() {
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [pastEvents, setPastEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [attending, setAttending] = useState({})
  const [attendanceCounts, setAttendanceCounts] = useState({})
  const [attendanceNames, setAttendanceNames] = useState({})
  const [members, setMembers] = useState([])
  const [modal, setModal] = useState(null)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('present')
  const [userId, setUserId] = useState(null)
  const [showPast, setShowPast] = useState(false)
  const [expandedEvents, setExpandedEvents] = useState({})

  // カレンダー表示
  const [calendarMonth, setCalendarMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [calendarEvents, setCalendarEvents] = useState([])
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => todayLocalStr())

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        fetchAll(user.id)
      }
    })
  }, [])

  const fetchAll = async (uid) => {
    const today = todayLocalStr()
    const [{ data: upcoming }, { data: past }, { data: allMembers }] = await Promise.all([
      supabase.from('events').select('*').gte('event_date', today).order('event_date'),
      supabase.from('events').select('*').lt('event_date', today).order('event_date', { ascending: false }).limit(10),
      supabase.from('profiles').select('id, name, team').eq('status', 'active'),
    ])
    if (upcoming) setUpcomingEvents(upcoming)
    if (past) setPastEvents(past)
    if (allMembers) setMembers(allMembers)
    const allIds = [...(upcoming || []), ...(past || [])].map(e => e.id)
    if (allIds.length > 0) {
      fetchMyAttendance(uid, allIds)
      fetchAttendanceData(allIds, allMembers || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (filter === 'calendar') fetchCalendarEvents(calendarMonth)
  }, [filter, calendarMonth])

  const fetchCalendarEvents = async (monthDate) => {
    setCalendarLoading(true)
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const { data } = await supabase.from('events').select('*').gte('event_date', from).lte('event_date', to).order('event_date')
    if (data) setCalendarEvents(data)
    setCalendarLoading(false)
  }

  const fetchMyAttendance = async (uid, eventIds) => {
    const { data } = await supabase.from('attendance').select('*').eq('member_id', uid).in('event_id', eventIds)
    if (data) {
      const map = {}
      data.forEach(a => { map[a.event_id] = a })
      setAttending(map)
    }
  }

  const fetchAttendanceData = async (eventIds, allMembers) => {
    const { data } = await supabase.from('attendance').select('*').in('event_id', eventIds)
    if (data) {
      const counts = {}
      const names = {}
      eventIds.forEach(id => {
        counts[id] = { present: 0, absent: 0, late: 0, early_leave: 0, undecided: 0 }
        names[id] = { present: [], absent: [], late: [], early_leave: [], undecided: [] }
      })
      data.forEach(a => {
        if (counts[a.event_id] && a.status in counts[a.event_id]) {
          counts[a.event_id][a.status]++
          const member = allMembers.find(m => m.id === a.member_id)
          if (member) {
            names[a.event_id][a.status].push({ name: member.name, comment: a.comment || '' })
          }
        }
      })
      setAttendanceCounts(counts)
      setAttendanceNames(names)
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
    const allIds = [...new Set([...upcomingEvents, ...pastEvents, ...calendarEvents].map(e => e.id))]
    fetchMyAttendance(userId, allIds)
    fetchAttendanceData(allIds, members)
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
    const weekday = WEEKDAYS[d.getDay()]
    const isWeekend = d.getDay() === 0 || d.getDay() === 6
    const att = attending[ev.id]
    const counts = attendanceCounts[ev.id] || {}
    const names = attendanceNames[ev.id] || {}
    const totalResponded = (counts.present || 0) + (counts.absent || 0) + (counts.late || 0) + (counts.early_leave || 0) + (counts.undecided || 0)

    // 未回答メンバー（そのイベントのカテゴリに所属するメンバー）
    const targetMembers = members.filter(m => ev.category === 'joint' || m.team === ev.category)
    const respondedIds = Object.values(names).flat().map(n => n.name)
    const noAnswerCount = targetMembers.length - totalResponded

    const isExpanded = expandedEvents[ev.id]

    return (
      <div style={{
        background: isPast ? '#fafafa' : 'white', borderRadius: '10px', padding: '16px 18px',
        marginBottom: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        borderLeft: `4px solid ${isPast ? '#ccc' : '#e8c84a'}`, opacity: isPast ? 0.75 : 1
      }}>
        {/* ヘッダー行 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
          <div style={{ flex: 1 }}>
            {/* 日付・曜日 */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '26px', lineHeight: 1, color: isPast ? '#aaa' : '#2a2220' }}>{d.getDate()}</span>
              <span style={{ fontSize: '11px', color: '#8a7f7a' }}>{d.toLocaleString('en', { month: 'short' }).toUpperCase()}</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: isPast ? '#aaa' : isWeekend ? (d.getDay() === 0 ? '#e74c3c' : '#2a5fa5') : '#2a2220' }}>
                （{weekday}）
              </span>
              <span style={{ background: cat.bg, color: cat.color, fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px' }}>{cat.label}</span>
            </div>
            {/* タイトル */}
            <div style={{ fontWeight: '700', fontSize: '14px', color: isPast ? '#888' : '#2a2220', marginBottom: '8px' }}>{ev.title}</div>

            {/* 場所・時間情報 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(ev.kickoff_time || ev.end_time) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
                  <span style={{ background: '#e8c84a', color: '#2a2220', fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '3px', flexShrink: 0 }}>
                    {ev.event_type === '練習' || ev.event_type === '合同練習' ? '開始' : 'KO'}
                  </span>
                  <span style={{ fontWeight: '600', color: '#2a2220' }}>
                    {ev.kickoff_time ? ev.kickoff_time.slice(0,5) : ''}
                    {ev.end_time ? ` 〜 ${ev.end_time.slice(0,5)}` : ''}
                  </span>
                  {ev.venue && <span style={{ color: '#8a7f7a' }}>｜</span>}
                  {ev.venue && <span style={{ color: '#555' }}>📍 {ev.venue}</span>}
                </div>
              )}
              {!ev.kickoff_time && ev.venue && (
                <div style={{ fontSize: '12.5px', color: '#555' }}>📍 {ev.venue}</div>
              )}
              {(ev.meetup_place || ev.meetup_time) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <span style={{ background: '#e8e0d8', color: '#8a7f7a', fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '3px', flexShrink: 0 }}>集合</span>
                  {ev.meetup_time && <span style={{ fontWeight: '600', color: '#555' }}>{ev.meetup_time.slice(0,5)}</span>}
                  {ev.meetup_place && <span style={{ color: '#555' }}>🚩 {ev.meetup_place}</span>}
                </div>
              )}
            </div>
          </div>

          {/* 出欠ボタン */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
            {!isPast && (att ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#27ae60', fontWeight: '600' }}>{statusLabel(att.status)}</span>
                <button onClick={() => { setModal(ev); setStatus(att.status); setComment(att.comment || '') }}
                  style={{ padding: '4px 9px', background: 'transparent', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '11.5px', cursor: 'pointer' }}>変更</button>
              </div>
            ) : (
              <button onClick={() => { setModal(ev); setStatus('present'); setComment('') }}
                style={{ padding: '6px 12px', background: '#e8c84a', color: '#2a2220', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>出欠登録</button>
            ))}
            {isPast && att && <span style={{ fontSize: '11px', color: '#8a7f7a' }}>{statusLabel(att.status)}</span>}
          </div>
        </div>

        {/* 出欠集計 */}
        {totalResponded > 0 && (
          <div style={{ borderTop: '1px solid #f0ebe5', paddingTop: '10px' }}>
            {/* カウント行 */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '6px', alignItems: 'center' }}>
              {[
                { key: 'present', label: '✅ 出席', color: '#27ae60', count: counts.present || 0 },
                { key: 'late', label: '⏰ 遅刻', color: '#e67e22', count: counts.late || 0 },
                { key: 'early_leave', label: '🚪 早退', color: '#16a085', count: counts.early_leave || 0 },
                { key: 'absent', label: '❌ 欠席', color: '#e74c3c', count: counts.absent || 0 },
                { key: 'undecided', label: '❓ 未定', color: '#f39c12', count: counts.undecided || 0 },
                { key: 'noanswer', label: '📝 未回答', color: '#8a7f7a', count: noAnswerCount > 0 ? noAnswerCount : 0 },
              ].map(({ key, label, color, count }) => count > 0 && (
                <span key={key} style={{ fontSize: '12px', fontWeight: '600', color }}>
                  {label} {count}名
                </span>
              ))}
              <button onClick={() => setExpandedEvents(prev => ({ ...prev, [ev.id]: !prev[ev.id] }))}
                style={{ marginLeft: 'auto', fontSize: '11px', color: '#8a7f7a', background: 'transparent', border: '1px solid #e0dbd5', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer' }}>
                {isExpanded ? '▲ 閉じる' : '▼ 名前を見る'}
              </button>
            </div>

            {/* 名前一覧（展開時） */}
            {isExpanded && (
              <div style={{ background: '#f8f5f0', borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { key: 'present', label: '✅ 出席', color: '#27ae60', list: names.present || [] },
                  { key: 'late', label: '⏰ 遅刻', color: '#e67e22', list: names.late || [] },
                  { key: 'early_leave', label: '🚪 早退', color: '#16a085', list: names.early_leave || [] },
                  { key: 'absent', label: '❌ 欠席', color: '#e74c3c', list: names.absent || [] },
                  { key: 'undecided', label: '❓ 未定', color: '#f39c12', list: names.undecided || [] },
                ].map(({ key, label, color, list }) => list.length > 0 && (
                  <div key={key}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color, marginBottom: '4px' }}>{label}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {list.map((item, i) => (
                        <div key={i} style={{ fontSize: '12px' }}>
                          <span style={{ background: 'white', border: `1px solid ${color}30`, borderRadius: '4px', padding: '2px 8px', color: '#2a2220' }}>{item.name}</span>
                          {item.comment && <span style={{ fontSize: '11px', color: '#8a7f7a', marginLeft: '4px' }}>「{item.comment}」</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {noAnswerCount > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#8a7f7a', marginBottom: '4px' }}>📝 未回答</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {targetMembers
                        .filter(m => !Object.values(names).flat().some(n => n.name === m.name))
                        .map((m, i) => (
                          <span key={i} style={{ fontSize: '12px', background: 'white', border: '1px solid #e0dbd5', borderRadius: '4px', padding: '2px 8px', color: '#8a7f7a' }}>{m.name}</span>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const Section = ({ title, color, evs, isPast }) => {
    if (evs.length === 0) return null
    return (
      <div style={{ marginBottom: '22px' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '14px', fontWeight: 'bold', color, marginBottom: '10px', letterSpacing: '1px' }}>■ {title}</div>
        {evs.map(ev => <EventCard key={ev.id} ev={ev} isPast={isPast} />)}
      </div>
    )
  }

  const buildCalendarGrid = (monthDate) => {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const firstDayOfWeek = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    const weeks = []
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
    return weeks
  }

  const CalendarView = () => {
    const weeks = buildCalendarGrid(calendarMonth)
    const monthLabel = `${calendarMonth.getFullYear()}年 ${calendarMonth.getMonth() + 1}月`
    const todayStr = todayLocalStr()
    const dateStrOf = (day) => `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const eventsOnDay = (day) => day ? calendarEvents.filter(e => e.event_date === dateStrOf(day)) : []
    const selectedDayEvents = calendarEvents.filter(e => e.event_date === selectedDate)

    const navBtnStyle = { padding: '5px 14px', background: '#f0ebe5', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', color: '#2a2220', fontWeight: '600' }

    const goPrevMonth = () => { setSelectedDate(null); setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)) }
    const goNextMonth = () => { setSelectedDate(null); setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)) }
    const goToday = () => { const d = new Date(); setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1)); setSelectedDate(todayStr) }

    return (
      <div>
        <div style={{ background: 'white', borderRadius: '10px', padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '8px' }}>
            <button onClick={goPrevMonth} style={navBtnStyle}>◀</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '19px', letterSpacing: '1px', color: '#2a2220' }}>{monthLabel}</span>
              <span onClick={goToday} style={{ fontSize: '11px', color: '#8a7f7a', cursor: 'pointer', textDecoration: 'underline' }}>今月</span>
            </div>
            <button onClick={goNextMonth} style={navBtnStyle}>▶</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '3px', marginBottom: '3px' }}>
            {WEEKDAYS.map((w, i) => (
              <div key={w} style={{ textAlign: 'center', fontSize: '10.5px', fontWeight: '700', color: i === 0 ? '#e74c3c' : i === 6 ? '#2a5fa5' : '#8a7f7a', padding: '2px 0' }}>{w}</div>
            ))}
          </div>

          {calendarLoading ? (
            <div style={{ color: '#8a7f7a', fontSize: '13px', textAlign: 'center', padding: '20px' }}>読み込み中...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '3px' }}>
                  {week.map((day, di) => {
                    const dStr = day ? dateStrOf(day) : null
                    const isToday = dStr === todayStr
                    const isSelected = dStr === selectedDate
                    const dayEvents = eventsOnDay(day)
                    return (
                      <div key={di} onClick={() => day && setSelectedDate(dStr)} style={{
                        minHeight: '52px', borderRadius: '6px', padding: '3px',
                        background: !day ? 'transparent' : isSelected ? '#2a2220' : isToday ? '#fef6e0' : '#fafafa',
                        border: isToday && !isSelected ? '1.5px solid #e8c84a' : '1px solid #f0ebe5',
                        cursor: day ? 'pointer' : 'default',
                      }}>
                        {day && (
                          <>
                            <div style={{
                              fontSize: '11px', fontWeight: isToday ? '700' : '500',
                              color: isSelected ? 'white' : di === 0 ? '#e74c3c' : di === 6 ? '#2a5fa5' : '#8a7f7a',
                              marginBottom: '2px'
                            }}>{day}</div>
                            {dayEvents.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                                {dayEvents.slice(0, 4).map(ev => {
                                  const cat = catInfo(ev.category)
                                  return (
                                    <span key={ev.id} title={ev.title} style={{
                                      width: '15px', height: '15px', borderRadius: '50%',
                                      background: isSelected ? '#3a322c' : cat.bg,
                                      border: `1.5px solid ${isSelected ? '#e8c84a' : cat.color}`,
                                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: '9px', lineHeight: 1, flexShrink: 0,
                                    }}>⚽</span>
                                  )
                                })}
                                {dayEvents.length > 4 && (
                                  <span style={{ fontSize: '9px', color: isSelected ? '#e8c84a' : '#8a7f7a', alignSelf: 'center' }}>+{dayEvents.length - 4}</span>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#2a2220', marginBottom: '10px' }}>
            {selectedDate ? `📅 ${selectedDate.replace(/-/g, '/')} の予定` : '日付を選択してください'}
          </div>
          {selectedDate && (selectedDayEvents.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '10px', padding: '18px', textAlign: 'center', color: '#8a7f7a', fontSize: '12.5px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              予定はありません
            </div>
          ) : (
            selectedDayEvents.map(ev => <EventCard key={ev.id} ev={ev} isPast={ev.event_date < todayStr} />)
          ))}
        </div>
      </div>
    )
  }

  const filteredUpcoming = applyFilter(upcomingEvents)
  const filteredPast = applyFilter(pastEvents)
  const upG = { u40: filteredUpcoming.filter(e => e.category === 'u40'), o40: filteredUpcoming.filter(e => e.category === 'o40'), joint: filteredUpcoming.filter(e => e.category === 'joint') }
  const paG = { u40: filteredPast.filter(e => e.category === 'u40'), o40: filteredPast.filter(e => e.category === 'o40'), joint: filteredPast.filter(e => e.category === 'joint') }

  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '2px', color: '#2a2220', marginBottom: '20px' }}>スケジュール・出欠</div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[['all','全体'],['calendar','カレンダー'],['u40','U-40'],['o40','O-40'],['joint','合同']].map(([v,l]) => (
          <div key={v} style={tabStyle(v)} onClick={() => setFilter(v)}>{l}</div>
        ))}
      </div>

      {loading ? <div style={{ color: '#8a7f7a', fontSize: '13px' }}>読み込み中...</div> : filter === 'calendar' ? (
        <CalendarView />
      ) : (
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
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '19px', letterSpacing: '1px', marginBottom: '14px' }}>📅 出欠登録</div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>{modal.title}</div>
            <div style={{ fontSize: '12px', color: '#8a7f7a', marginBottom: '16px' }}>
              {modal.event_date} / {modal.kickoff_time ? modal.kickoff_time.slice(0,5) : '時間未定'} / {modal.venue || '場所未定'}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#8a7f7a', display: 'block', marginBottom: '4px' }}>出欠</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e0dbd5', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}>
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
                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e0dbd5', borderRadius: '6px', fontSize: '13px', resize: 'none', fontFamily: 'inherit' }} />
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
