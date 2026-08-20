import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const card = {
  background: 'white', borderRadius: '10px', padding: '18px 22px',
  marginBottom: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
}

const statBox = (color = '#e8c84a') => ({
  background: 'white', borderRadius: '10px', padding: '16px 18px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderTop: `3px solid ${color}`
})

const pctColor = (r) => r >= 70 ? '#27ae60' : r >= 50 ? '#f39c12' : '#e74c3c'

const ProgressBar = ({ pct, color }) => (
  <div style={{ flex: 1, background: '#e8e0d8', borderRadius: '99px', height: '7px', overflow: 'hidden' }}>
    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '99px' }} />
  </div>
)

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, u40: 0, o40: 0 })
  const [events, setEvents] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [topU40, setTopU40] = useState([])
  const [topO40, setTopO40] = useState([])
  const [birthdayMembers, setBirthdayMembers] = useState([])
  const [matches, setMatches] = useState([])

  useEffect(() => {
    fetchStats()
    fetchEvents()
    fetchAnnouncements()
    fetchAttendance()
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    const { data } = await supabase.from('matches').select('team, score_us, score_them')
    if (data) setMatches(data)
  }

  const matchStats = (team) => {
    const tm = team ? matches.filter(m => m.team === team) : matches
    return {
      w: tm.filter(m => m.score_us > m.score_them).length,
      d: tm.filter(m => m.score_us === m.score_them).length,
      l: tm.filter(m => m.score_us < m.score_them).length,
    }
  }

  const fetchStats = async () => {
    const { data } = await supabase.from('profiles').select('id, name, team, status, birth_month, birth_day').eq('status', 'active')
    if (data) {
      const currentMonth = new Date().getMonth() + 1
      setStats({
        total: data.length,
        u40: data.filter(m => m.team === 'u40').length,
        o40: data.filter(m => m.team === 'o40').length,
      })
      setBirthdayMembers(data.filter(m => m.birth_month === currentMonth).sort((a, b) => (a.birth_day || 0) - (b.birth_day || 0)))
    }
  }

  const fetchEvents = async () => {
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const { data } = await supabase.from('events').select('*').gte('event_date', today).order('event_date').limit(3)
    if (data) setEvents(data)
  }

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(3)
    if (data) setAnnouncements(data)
  }

  const fetchAttendance = async () => {
    const { data: members } = await supabase.from('profiles').select('id, name, team').eq('status', 'active')
    const { data: evs } = await supabase.from('events').select('id, category')
    const { data: att } = await supabase.from('attendance').select('*')
    if (!members || !evs || !att) return
    const calcRate = (memberId, team) => {
      const teamEvs = evs.filter(e => e.category === team || e.category === 'joint')
      if (teamEvs.length === 0) return 0
      const present = att.filter(a => a.member_id === memberId && teamEvs.map(e => e.id).includes(a.event_id) && a.status === 'present').length
      return Math.round((present / teamEvs.length) * 100)
    }
    setTopU40(members.filter(m => m.team === 'u40').map(m => ({ ...m, rate: calcRate(m.id, 'u40') })).sort((a, b) => b.rate - a.rate).slice(0, 5))
    setTopO40(members.filter(m => m.team === 'o40').map(m => ({ ...m, rate: calcRate(m.id, 'o40') })).sort((a, b) => b.rate - a.rate).slice(0, 5))
  }

  const catInfo = (cat) => {
    if (cat === 'u40') return { label: 'U-40', color: '#7b5ea7', bg: '#ede8f7' }
    if (cat === 'o40') return { label: 'O-40', color: '#2a5fa5', bg: '#dceeff' }
    return { label: '合同', color: '#e8a020', bg: '#fef3e2' }
  }

  const medals = ['🥇', '🥈', '🥉', '4.', '5.']
  const currentMonth = new Date().getMonth() + 1

  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '2px', color: '#2a2220', marginBottom: '20px' }}>
        DASHBOARD
      </div>

      {/* 上段：スケジュール＋お知らせ */}
      <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '0' }}>
        {/* スケジュール */}
        <div style={card}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '1.5px', marginBottom: '12px' }}>
            📅 直近のスケジュール
          </div>
          {events.length === 0 && <div style={{ color: '#8a7f7a', fontSize: '13px' }}>予定はありません</div>}
          {events.map(ev => {
            const cat = catInfo(ev.category)
            const d = new Date(ev.event_date)
            const weekday = WEEKDAYS[d.getDay()]
            const isWeekend = d.getDay() === 0 || d.getDay() === 6
            return (
              <div key={ev.id} style={{
                borderRadius: '8px', padding: '13px 15px', marginBottom: '10px',
                borderLeft: '4px solid #e8c84a', background: '#fafafa',
                boxShadow: '0 1px 3px rgba(0,0,0,0.07)'
              }}>
                {/* 日付・曜日・カテゴリー */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', lineHeight: 1, color: '#2a2220' }}>{d.getDate()}</span>
                    <span style={{ fontSize: '12px', color: '#8a7f7a' }}>{d.toLocaleString('en', { month: 'short' }).toUpperCase()}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: isWeekend ? (d.getDay() === 0 ? '#e74c3c' : '#2a5fa5') : '#2a2220' }}>
                      （{weekday}）
                    </span>
                  </div>
                  <span style={{ background: cat.bg, color: cat.color, fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                    {cat.label}
                  </span>
                </div>

                {/* タイトル */}
                <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>{ev.title}</div>

                {/* 詳細情報 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {(ev.kickoff_time || ev.end_time) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#555' }}>
                      <span style={{ fontSize: '14px' }}>⏰</span>
                      <span style={{ fontWeight: '600' }}>
                        {ev.kickoff_time ? ev.kickoff_time.slice(0,5) : ''}
                        {ev.end_time ? ` 〜 ${ev.end_time.slice(0,5)}` : ''}
                      </span>
                    </div>
                  )}
                  {ev.venue && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#555' }}>
                      <span style={{ fontSize: '14px' }}>📍</span>
                      <span>{ev.venue}</span>
                    </div>
                  )}
                  {ev.meetup_place && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#8a7f7a' }}>
                      <span style={{ fontSize: '13px' }}>🚩</span>
                      <span>集合: {ev.meetup_place}{ev.meetup_time ? ` ${ev.meetup_time.slice(0,5)}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* お知らせ */}
        <div style={card}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '1.5px', marginBottom: '12px' }}>
            📢 最新のお知らせ
          </div>
          {announcements.length === 0 && <div style={{ color: '#8a7f7a', fontSize: '13px' }}>お知らせはありません</div>}
          {announcements.map(a => (
            <div key={a.id} style={{
              borderRadius: '8px', padding: '12px 16px', marginBottom: '8px',
              borderLeft: `4px solid ${a.pinned ? '#e74c3c' : '#e8c84a'}`,
              background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>
                {a.pinned && '📌 '}{a.title}
              </div>
              <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.5 }}>
                {a.body.length > 60 ? a.body.slice(0, 60) + '...' : a.body}
              </div>
              <div style={{ fontSize: '10.5px', color: '#8a7f7a', marginTop: '6px' }}>
                👤 {a.author_name}　📅 {new Date(a.created_at).toLocaleDateString('ja-JP')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 中段：出席率 */}
      <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
        <div style={card}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '1px', color: '#2a2220', marginBottom: '12px' }}>
            <span style={{ color: '#7b5ea7' }}>■</span> U-40 出席率 トップ5
          </div>
          {topU40.length === 0 ? <div style={{ color: '#8a7f7a', fontSize: '12px' }}>データがありません</div> :
            topU40.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < topU40.length - 1 ? '1px solid #f0ebe5' : 'none', fontSize: '13px' }}>
                <div style={{ width: '22px', fontSize: '12px', flexShrink: 0 }}>{medals[i]}</div>
                <div style={{ width: '110px', fontWeight: '500', flexShrink: 0, fontSize: '12.5px' }}>{m.name}</div>
                <ProgressBar pct={m.rate} color={pctColor(m.rate)} />
                <div style={{ width: '40px', textAlign: 'right', fontWeight: '700', fontSize: '12px', color: pctColor(m.rate), flexShrink: 0 }}>{m.rate}%</div>
              </div>
            ))
          }
        </div>
        <div style={card}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '1px', color: '#2a2220', marginBottom: '12px' }}>
            <span style={{ color: '#2a5fa5' }}>■</span> O-40 出席率 トップ5
          </div>
          {topO40.length === 0 ? <div style={{ color: '#8a7f7a', fontSize: '12px' }}>データがありません</div> :
            topO40.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < topO40.length - 1 ? '1px solid #f0ebe5' : 'none', fontSize: '13px' }}>
                <div style={{ width: '22px', fontSize: '12px', flexShrink: 0 }}>{medals[i]}</div>
                <div style={{ width: '110px', fontWeight: '500', flexShrink: 0, fontSize: '12.5px' }}>{m.name}</div>
                <ProgressBar pct={m.rate} color={pctColor(m.rate)} />
                <div style={{ width: '40px', textAlign: 'right', fontWeight: '700', fontSize: '12px', color: pctColor(m.rate), flexShrink: 0 }}>{m.rate}%</div>
              </div>
            ))
          }
        </div>
      </div>

      {/* 下段：統計 */}
      <div className="grid-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
        {/* 今月の誕生日 */}
        <div style={statBox('#e74c3c')}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', letterSpacing: '1px', color: '#e74c3c', marginBottom: '8px' }}>
            🎂 {currentMonth}月の誕生日
          </div>
          {birthdayMembers.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#8a7f7a' }}>今月の誕生日はいません</div>
          ) : (
            birthdayMembers.map(m => (
              <div key={m.id} style={{ fontSize: '13px', fontWeight: '500', padding: '4px 0', borderBottom: '1px solid #f0ebe5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🎉</span>
                <span>{m.name}</span>
                {m.birth_day && <span style={{ fontSize: '11px', color: '#8a7f7a' }}>（{m.birth_month}/{m.birth_day}）</span>}
              </div>
            ))
          )}
        </div>

        {/* チーム内訳＋登録メンバー */}
        <div style={statBox('#7b5ea7')}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '38px', lineHeight: 1, color: '#2a2220' }}>{stats.total}</div>
          <div style={{ fontSize: '11.5px', color: '#8a7f7a', marginTop: '2px', marginBottom: '8px' }}>登録メンバー</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ background: '#ede8f7', color: '#7b5ea7', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>U-40: {stats.u40}名</span>
            <span style={{ background: '#dceeff', color: '#2a5fa5', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>O-40: {stats.o40}名</span>
          </div>
        </div>

        {/* 今期成績 */}
        <div style={statBox('#27ae60')}>
          {matches.length === 0 ? (
            <>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '38px', lineHeight: 1 }}>－</div>
              <div style={{ fontSize: '11.5px', color: '#8a7f7a', marginTop: '3px' }}>今期成績</div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '38px', lineHeight: 1, color: '#2a2220' }}>
                {matchStats().w}<span style={{ fontSize: '16px', marginLeft: '2px' }}>勝</span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#8a7f7a', marginTop: '2px', marginBottom: '8px' }}>
                今期成績（{matchStats().w}勝{matchStats().d}分{matchStats().l}敗）
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: '#ede8f7', color: '#7b5ea7', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                  U-40: {matchStats('u40').w}勝{matchStats('u40').d}分{matchStats('u40').l}敗
                </span>
                <span style={{ background: '#dceeff', color: '#2a5fa5', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                  O-40: {matchStats('o40').w}勝{matchStats('o40').d}分{matchStats('o40').l}敗
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
