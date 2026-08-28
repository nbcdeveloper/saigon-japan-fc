import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

// UTCではなくローカル時間（ベトナム時間）基準で「今日」の日付文字列を作る
const todayLocalStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

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

// 生年月日から年齢を自動計算（月日が未入力の場合は年のみで概算）
const calcAge = (m) => {
  if (!m.birth_year) return null
  const today = new Date()
  let age = today.getFullYear() - m.birth_year
  if (m.birth_month) {
    const curM = today.getMonth() + 1
    const curD = today.getDate()
    const bm = m.birth_month
    const bd = m.birth_day || 1
    if (curM < bm || (curM === bm && curD < bd)) age--
  }
  return age
}

const avgAgeOf = (list) => {
  const ages = list.map(calcAge).filter(a => a !== null)
  if (ages.length === 0) return null
  return Math.round((ages.reduce((s, a) => s + a, 0) / ages.length) * 10) / 10
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ total: 0, u40: 0, o40: 0 })
  const [avgAge, setAvgAge] = useState({ all: null, u40: null, o40: null })
  const [events, setEvents] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [topU40, setTopU40] = useState([])
  const [topO40, setTopO40] = useState([])
  const [birthdayMembers, setBirthdayMembers] = useState([])
  const [matches, setMatches] = useState([])
  const [unansweredCount, setUnansweredCount] = useState(0)

  useEffect(() => {
    fetchStats()
    fetchEvents()
    fetchAnnouncements()
    fetchAttendance()
    fetchMatches()
    fetchMyUnanswered()
  }, [])

  const fetchMyUnanswered = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('team, dual_team').eq('id', user.id).single()
    if (!profile) return
    const myCategories = profile.dual_team ? ['u40', 'o40', 'joint'] : [profile.team, 'joint']
    const today = todayLocalStr()
    const { data: myEvents } = await supabase.from('events').select('id').gte('event_date', today).in('category', myCategories)
    if (!myEvents || myEvents.length === 0) { setUnansweredCount(0); return }
    const eventIds = myEvents.map(e => e.id)
    const { data: myAttendance } = await supabase.from('attendance').select('event_id').eq('member_id', user.id).in('event_id', eventIds)
    const answeredIds = new Set((myAttendance || []).map(a => a.event_id))
    setUnansweredCount(eventIds.filter(id => !answeredIds.has(id)).length)
  }

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
    const { data } = await supabase.from('profiles').select('id, name, team, status, birth_year, birth_month, birth_day').eq('status', 'active')
    if (data) {
      const currentMonth = new Date().getMonth() + 1
      setStats({
        total: data.length,
        u40: data.filter(m => m.team === 'u40').length,
        o40: data.filter(m => m.team === 'o40').length,
      })
      setBirthdayMembers(data.filter(m => m.birth_month === currentMonth).sort((a, b) => (a.birth_day || 0) - (b.birth_day || 0)))
      setAvgAge({
        all: avgAgeOf(data),
        u40: avgAgeOf(data.filter(m => m.team === 'u40')),
        o40: avgAgeOf(data.filter(m => m.team === 'o40')),
      })
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
      {unansweredCount > 0 && (
        <div onClick={() => navigate('/schedule')} style={{
          display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
          background: '#fdecea', border: '1.5px solid #e74c3c', borderRadius: '10px',
          padding: '13px 18px', marginBottom: '18px'
        }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
          <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#c0392b' }}>
            出欠未回答のものが{unansweredCount}件あります。
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#c0392b', fontWeight: '600', flexShrink: 0 }}>確認する ›</span>
        </div>
      )}

      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '2px', color: '#2a2220', marginBottom: '20px' }}>
        DASHBOARD
      </div>

      {/* 1〜2. 直近のスケジュール／最新のお知らせ */}
      <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '0' }}>
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
            background: '#fafafa', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
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

      {/* 3〜6. 誕生日／登録メンバー／今期成績／平均年齢 */}
      <div className="grid-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '18px' }}>
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

        {/* 平均年齢（新設） */}
        <div style={statBox('#e8a020')}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '38px', lineHeight: 1, color: '#2a2220' }}>
            {avgAge.all !== null ? avgAge.all : '－'}<span style={{ fontSize: '16px', marginLeft: '2px' }}>歳</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#8a7f7a', marginTop: '2px', marginBottom: '8px' }}>平均年齢</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ background: '#ede8f7', color: '#7b5ea7', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
              U-40: {avgAge.u40 !== null ? `${avgAge.u40}歳` : '－'}
            </span>
            <span style={{ background: '#dceeff', color: '#2a5fa5', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
              O-40: {avgAge.o40 !== null ? `${avgAge.o40}歳` : '－'}
            </span>
          </div>
        </div>
      </div>

      {/* 7〜8. 出席率トップ5 */}
      <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
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

    </div>
  )
}
