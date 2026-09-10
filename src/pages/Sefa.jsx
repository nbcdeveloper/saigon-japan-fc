import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'

const th = { background: '#2a2220', color: '#e8c84a', padding: '9px 12px', textAlign: 'left', fontSize: '12px', whiteSpace: 'nowrap', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }

// UTCではなくローカル時間（ベトナム時間）基準で「今日」の日付文字列を作る
const todayLocalStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const resultTag = (m) => {
  if (m.score_us > m.score_them) return <span style={{ background: '#d4f4e0', color: '#1a7a40', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>WIN</span>
  if (m.score_us === m.score_them) return <span style={{ background: '#e8eaf6', color: '#3949ab', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>DRAW</span>
  return <span style={{ background: '#fde8e6', color: '#c0392b', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>LOSS</span>
}

const teamBadge = (team) => (
  <span style={{ background: team === 'u40' ? '#ede8f7' : '#dceeff', color: team === 'u40' ? '#7b5ea7' : '#2a5fa5', fontSize: '10.5px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px' }}>
    {team === 'u40' ? 'U-40' : 'O-40'}
  </span>
)

// イベントのカテゴリ（u40/o40/joint）バッジ。試合予定（events）用
const catBadge = (category) => {
  const map = { u40: { label: 'U-40', bg: '#ede8f7', color: '#7b5ea7' }, o40: { label: 'O-40', bg: '#dceeff', color: '#2a5fa5' }, joint: { label: '合同', bg: '#fef3e2', color: '#e8a020' } }
  const c = map[category] || map.joint
  return <span style={{ background: c.bg, color: c.color, fontSize: '10.5px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px' }}>{c.label}</span>
}

// 順位表・得点ランキングでSJFCの2チーム（Saigon Japan＝U-40／Saigon Japan O-40＝O-40）を色分け表示するためのスタイル
const sjfcTeamStyle = (teamName) => {
  if (teamName === 'Saigon Japan') return { bg: '#ede8f7', color: '#7b5ea7' } // U-40（紫）
  if (teamName === 'Saigon Japan O-40') return { bg: '#dceeff', color: '#2a5fa5' } // O-40（青）
  return null
}

export default function Sefa() {
  const [matches, setMatches] = useState([])
  const [goals, setGoals] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sefaStandings, setSefaStandings] = useState([])
  const [sefaTopScorers, setSefaTopScorers] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const today = todayLocalStr()
    const [{ data: m }, { data: g }, { data: mem }, { data: st }, { data: sc }, { data: ev }] = await Promise.all([
      supabase.from('matches').select('*').eq('match_type', 'SEFA 11S').order('match_date', { ascending: false }),
      supabase.from('goals').select('*'),
      supabase.from('profiles').select('id, name, team'),
      supabase.from('sefa_standings').select('*'),
      supabase.from('sefa_top_scorers').select('*').order('goals', { ascending: false }),
      supabase.from('events').select('*').eq('event_type', 'SEFA 11S').gte('event_date', today).order('event_date'),
    ])
    if (m) setMatches(m)
    if (g) setGoals(g)
    if (mem) setMembers(mem)
    if (st) setSefaStandings(st)
    if (sc) setSefaTopScorers(sc)
    if (ev) setUpcomingEvents(ev)
    setLoading(false)
  }

  // 勝点（勝×3＋分×1）→得失点差→得点数の順で順位表を並び替え
  const sortedStandings = [...sefaStandings].sort((a, b) => {
    const pa = a.won * 3 + a.drawn, pb = b.won * 3 + b.drawn
    if (pb !== pa) return pb - pa
    const gda = a.gf - a.ga, gdb = b.gf - b.ga
    if (gdb !== gda) return gdb - gda
    return b.gf - a.gf
  })

  // 結果（SJFC自チーム）: match_type='SEFA 11S'のうち、U-40・O-40それぞれ最新1件のみ
  // （matchesはmatch_date降順で取得済みなので、各チームの先頭が最新）
  const latestByTeam = ['u40', 'o40']
    .map(team => matches.find(m => m.team === team))
    .filter(Boolean)

  const MatchResultCard = (m) => {
    const matchGoals = goals.filter(g => g.match_id === m.id)
    const scorerNames = matchGoals.map(g => {
      const member = members.find(mem => mem.id === g.member_id)
      if (!member) return ''
      const assistMember = g.assist_member_id ? members.find(mem => mem.id === g.assist_member_id) : null
      return `${member.name}${g.minute ? `(${g.minute}')` : ''}${assistMember ? ` [A: ${assistMember.name}]` : ''}`
    }).filter(Boolean)
    return (
      <div key={m.id} style={{ background: 'white', borderRadius: '10px', padding: '16px 20px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', fontSize: '12px', color: '#8a7f7a' }}>
          <span>{m.match_date}</span>
          {m.venue && <span>📍 {m.venue}</span>}
          {resultTag(m)}
          {teamBadge(m.team)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '10px 0' }}>
          <div style={{ fontWeight: '700', fontSize: '14px', textAlign: 'center', minWidth: '120px' }}>Saigon Japan FC</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '40px', letterSpacing: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: m.score_us > m.score_them ? '#27ae60' : m.score_us < m.score_them ? '#e74c3c' : '#2a2220' }}>{m.score_us}</span>
            <span style={{ color: '#8a7f7a', fontSize: '22px' }}>-</span>
            <span style={{ color: m.score_them > m.score_us ? '#27ae60' : m.score_them < m.score_us ? '#e74c3c' : '#2a2220' }}>{m.score_them}</span>
          </div>
          <div style={{ fontWeight: '700', fontSize: '14px', textAlign: 'center', minWidth: '120px' }}>{m.opponent}</div>
        </div>
        {scorerNames.length > 0 && (
          <div style={{ fontSize: '12px', color: '#555', paddingTop: '8px', borderTop: '1px solid #f0ebe5' }}>
            ⚽ {scorerNames.join('　')}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '2px', color: '#2a2220', marginBottom: '20px' }}>SEFA S11 2026</div>
        <div style={{ color: '#8a7f7a', fontSize: '13px' }}>読み込み中...</div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <img src="/sefa-logo.png" alt="SEFA S11" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '2px', color: '#2a2220' }}>SEFA S11 2026</div>
      </div>

      {/* 大会概要・ルールへのリンク */}
      <Link to="/sefa/info" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: 'white', borderRadius: '10px', padding: '14px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', textDecoration: 'none', color: '#2a2220', marginBottom: '20px' }}>
        <span style={{ fontWeight: '700', fontSize: '13.5px' }}>📋 大会概要・大会構成・主なルールを見る</span>
        <span style={{ color: '#8a7f7a' }}>›</span>
      </Link>

      {/* 試合予定（SJFC自チーム） */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '1px', color: '#2a2220', marginBottom: '12px' }}>📅 試合予定（Saigon Japan FC）</div>
        {upcomingEvents.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '10px', padding: '16px 20px', color: '#8a7f7a', fontSize: '13px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            予定されている試合はありません
          </div>
        ) : (
          upcomingEvents.map(ev => (
            <div key={ev.id} style={{ background: 'white', borderRadius: '10px', padding: '14px 18px', marginBottom: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              {catBadge(ev.category)}
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', color: '#2a2220' }}>{ev.event_date.replace(/-/g, '/')}</div>
              <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#2a2220' }}>{ev.title}</div>
              {ev.kickoff_time && <div style={{ fontSize: '12px', color: '#555' }}>KO {ev.kickoff_time.slice(0, 5)}</div>}
              {ev.venue && <div style={{ fontSize: '12px', color: '#8a7f7a' }}>📍 {ev.venue}</div>}
            </div>
          ))
        )}
      </div>

      {/* 順位表 */}
      <div style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: '20px' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '1px', color: '#2a2220', marginBottom: '12px' }}>📊 順位表</div>
        {sortedStandings.length === 0 ? <div style={{ color: '#8a7f7a', fontSize: '12px' }}>まだ順位表が登録されていません</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '520px' }}>
              <thead><tr>{['順位', 'チーム', '試合', '勝', '分', '敗', '得失点差', '勝点'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {sortedStandings.map((s, i) => {
                  const style = sjfcTeamStyle(s.team_name)
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f0ebe5', background: style ? style.bg : 'transparent' }}>
                      <td style={{ padding: '8px 12px', fontWeight: style ? '700' : '400' }}>{i + 1}</td>
                      <td style={{ padding: '8px 12px', fontWeight: style ? '700' : '500', color: style ? style.color : '#2a2220' }}>{s.team_name}</td>
                      <td style={{ padding: '8px 12px' }}>{s.played}</td>
                      <td style={{ padding: '8px 12px' }}>{s.won}</td>
                      <td style={{ padding: '8px 12px' }}>{s.drawn}</td>
                      <td style={{ padding: '8px 12px' }}>{s.lost}</td>
                      <td style={{ padding: '8px 12px' }}>{s.gf - s.ga > 0 ? `+${s.gf - s.ga}` : s.gf - s.ga}</td>
                      <td style={{ padding: '8px 12px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px' }}>{s.won * 3 + s.drawn}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 結果（SJFC自チーム） */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '1px', color: '#2a2220', marginBottom: '12px' }}>🏆 結果（Saigon Japan FC）</div>
        {latestByTeam.length === 0 ? (
          <div style={{ color: '#8a7f7a', fontSize: '13px' }}>まだ試合記録がありません</div>
        ) : (
          latestByTeam.map(m => MatchResultCard(m))
        )}
      </div>

      {/* 得点ランキング */}
      <div style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '1px', color: '#2a2220', marginBottom: '12px' }}>⚽ 得点ランキング</div>
        {sefaTopScorers.length === 0 ? <div style={{ color: '#8a7f7a', fontSize: '12px' }}>まだ得点ランキングが登録されていません</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead><tr>{['順位', '選手', 'チーム', '得点'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {sefaTopScorers.map((s, i) => {
                const style = sjfcTeamStyle(s.team_name)
                const medals = ['🥇', '🥈', '🥉']
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f0ebe5', background: style ? style.bg : 'transparent' }}>
                    <td style={{ padding: '8px 12px' }}>{medals[i] || `${i + 1}`}</td>
                    <td style={{ padding: '8px 12px', fontWeight: style ? '700' : '500' }}>{s.player_name}</td>
                    <td style={{ padding: '8px 12px', color: style ? style.color : '#8a7f7a', fontWeight: style ? '700' : '400' }}>{s.team_name}</td>
                    <td style={{ padding: '8px 12px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px' }}>{s.goals}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
