import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Results() {
  const [matches, setMatches] = useState([])
  const [goals, setGoals] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    const [{ data: m }, { data: g }, { data: mem }] = await Promise.all([
      supabase.from('matches').select('*').order('match_date', { ascending: false }),
      supabase.from('goals').select('*'),
      supabase.from('profiles').select('id, name, team'),
    ])
    if (m) setMatches(m)
    if (g) setGoals(g)
    if (mem) setMembers(mem)
    setLoading(false)
  }

  const filtered = matches.filter(m => filter === 'all' || m.team === filter)

  const stats = (team) => {
    const teamMatches = matches.filter(m => m.team === team)
    return {
      w: teamMatches.filter(m => m.score_us > m.score_them).length,
      d: teamMatches.filter(m => m.score_us === m.score_them).length,
      l: teamMatches.filter(m => m.score_us < m.score_them).length,
      gf: teamMatches.reduce((s, m) => s + (m.score_us || 0), 0),
      ga: teamMatches.reduce((s, m) => s + (m.score_them || 0), 0),
    }
  }

  const scorers = (team) => {
    const teamMembers = members.filter(m => m.team === team)
    const teamMatchIds = matches.filter(m => m.team === team).map(m => m.id)
    const teamGoals = goals.filter(g => teamMatchIds.includes(g.match_id))
    const map = {}
    teamGoals.forEach(g => {
      const member = teamMembers.find(m => m.id === g.member_id)
      if (member) {
        map[member.name] = (map[member.name] || 0) + 1
      }
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
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

  const tabStyle = (val) => ({
    padding: '6px 16px', borderRadius: '20px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer', border: '2px solid',
    borderColor: filter === val ? (val === 'u40' ? '#7b5ea7' : val === 'o40' ? '#2a5fa5' : '#2a2220') : '#ccc',
    background: filter === val ? (val === 'u40' ? '#7b5ea7' : val === 'o40' ? '#2a5fa5' : '#2a2220') : 'transparent',
    color: filter === val ? 'white' : '#8a7f7a',
  })

  const StatBox = ({ team }) => {
    const s = stats(team)
    const color = team === 'u40' ? '#7b5ea7' : '#2a5fa5'
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '14px' }}>
        {[['勝利', s.w, '#27ae60'], ['引分', s.d, '#3949ab'], ['敗北', s.l, '#e74c3c'], [`${s.gf} / ${s.ga}`, null, color]].map(([label, val, c], i) => (
          <div key={i} style={{ background: 'white', borderRadius: '10px', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderTop: `3px solid ${c}` }}>
            <div style={{ fontSize: '30px', fontFamily: 'serif', color: c, lineHeight: 1 }}>{val !== null ? val : label}</div>
            <div style={{ fontSize: '11px', color: '#8a7f7a', marginTop: '3px' }}>{val !== null ? label : '得点 / 失点'}</div>
          </div>
        ))}
      </div>
    )
  }

  const MatchList = ({ team }) => {
    const teamMatches = filtered.filter(m => m.team === team)
    if (teamMatches.length === 0) return <div style={{ color: '#8a7f7a', fontSize: '13px', marginBottom: '20px' }}>試合記録がありません</div>
    return (
      <div style={{ marginBottom: '20px' }}>
        {teamMatches.map(m => {
          const matchGoals = goals.filter(g => g.match_id === m.id)
          const scorerNames = matchGoals.map(g => {
            const member = members.find(mem => mem.id === g.member_id)
            return member ? `${member.name}${g.minute ? `(${g.minute}')` : ''}` : '不明'
          })
          return (
            <div key={m.id} style={{ background: 'white', borderRadius: '10px', padding: '16px 20px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', fontSize: '12px', color: '#8a7f7a' }}>
                <span>{m.match_date}</span>
                {m.venue && <span>📍 {m.venue}</span>}
                <span>{m.home_away === 'home' ? '🏠 ホーム' : m.home_away === 'away' ? '✈️ アウェイ' : '🏟️ 中立'}</span>
                {resultTag(m)}
                {teamBadge(m.team)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '10px 0' }}>
                <div style={{ fontWeight: '700', fontSize: '14px', textAlign: 'center', minWidth: '120px' }}>Saigon Japan FC</div>
                <div style={{ fontFamily: 'serif', fontSize: '40px', letterSpacing: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
              {m.notes && <div style={{ fontSize: '12px', color: '#8a7f7a', marginTop: '4px' }}>📝 {m.notes}</div>}
            </div>
          )
        })}
      </div>
    )
  }

  const ScorerRanking = ({ team }) => {
    const list = scorers(team)
    const color = team === 'u40' ? '#7b5ea7' : '#2a5fa5'
    const medals = ['🥇', '🥈', '🥉']
    return (
      <div style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#2a2220', marginBottom: '12px' }}>
          <span style={{ color }}>■</span> {team === 'u40' ? 'U-40' : 'O-40'} 得点ランキング
        </div>
        {list.length === 0 ? (
          <div style={{ color: '#8a7f7a', fontSize: '12px' }}>得点記録がありません</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {['順位', '選手', '得点'].map(h => (
                  <th key={h} style={{ background: '#2a2220', color: '#e8c84a', padding: '8px 12px', textAlign: 'left', fontSize: '12px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map(([name, count], i) => (
                <tr key={name} style={{ borderBottom: '1px solid #f0ebe5' }}>
                  <td style={{ padding: '8px 12px' }}>{medals[i] || `${i + 1}`}</td>
                  <td style={{ padding: '8px 12px', fontWeight: '500' }}>{name}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'serif', fontSize: '20px', color: '#2a2220', fontWeight: 'bold' }}>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2a2220', letterSpacing: '2px', marginBottom: '20px' }}>
        試合結果
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={tabStyle('all')} onClick={() => setFilter('all')}>全体</div>
        <div style={tabStyle('u40')} onClick={() => setFilter('u40')}>U-40</div>
        <div style={tabStyle('o40')} onClick={() => setFilter('o40')}>O-40</div>
      </div>

      {loading ? (
        <div style={{ color: '#8a7f7a', fontSize: '13px' }}>読み込み中...</div>
      ) : (
        <>
          {/* U-40 */}
          {(filter === 'all' || filter === 'u40') && (
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontFamily: 'serif', fontSize: '15px', fontWeight: 'bold', color: '#7b5ea7', marginBottom: '12px', letterSpacing: '1px' }}>■ U-40</div>
              <StatBox team="u40" />
              <MatchList team="u40" />
            </div>
          )}

          {/* O-40 */}
          {(filter === 'all' || filter === 'o40') && (
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontFamily: 'serif', fontSize: '15px', fontWeight: 'bold', color: '#2a5fa5', marginBottom: '12px', letterSpacing: '1px' }}>■ O-40</div>
              <StatBox team="o40" />
              <MatchList team="o40" />
            </div>
          )}

          {/* 得点ランキング */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <ScorerRanking team="u40" />
            <ScorerRanking team="o40" />
          </div>
        </>
      )}
    </div>
  )
}
