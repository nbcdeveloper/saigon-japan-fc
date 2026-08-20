import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const th = { background: '#2a2220', color: '#e8c84a', padding: '9px 12px', textAlign: 'left', fontSize: '12px', whiteSpace: 'nowrap', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }

const SJFC_NAME = 'Saigon Japan FC'

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

export default function Sefa() {
  const [matches, setMatches] = useState([])
  const [goals, setGoals] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sefaStandings, setSefaStandings] = useState([])
  const [sefaTopScorers, setSefaTopScorers] = useState([])

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [{ data: m }, { data: g }, { data: mem }, { data: st }, { data: sc }] = await Promise.all([
      supabase.from('matches').select('*').order('match_date', { ascending: false }),
      supabase.from('goals').select('*'),
      supabase.from('profiles').select('id, name, team'),
      supabase.from('sefa_standings').select('*'),
      supabase.from('sefa_top_scorers').select('*').order('goals', { ascending: false }),
    ])
    if (m) setMatches(m)
    if (g) setGoals(g)
    if (mem) setMembers(mem)
    if (st) setSefaStandings(st)
    if (sc) setSefaTopScorers(sc)
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

  // SEFAリーグ戦（match_type='リーグ戦'）のSJFC自チーム結果
  const sefaMatches = matches.filter(m => m.match_type === 'リーグ戦')

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <img src="/sefa-logo.png" alt="SEFA S11" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '2px', color: '#2a2220' }}>SEFA S11 2026</div>
      </div>

      {/* レギュレーション */}
      <div style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: '20px' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '1px', color: '#2a2220', marginBottom: '4px' }}>SEFA 11s Fall 2026</div>
        <div style={{ fontSize: '11.5px', color: '#8a7f7a', marginBottom: '14px' }}>2026年9月18日（金）〜12月5日（土）・全12週・U-40/O-40両チーム参加</div>

        <div style={{ fontSize: '12.5px', color: '#2a2220', lineHeight: 1.8 }}>
          <div style={{ fontWeight: '700', marginBottom: '4px' }}>■ 大会概要</div>
          <div style={{ marginBottom: '10px' }}>
            12クラブが参加するリーグ戦。会場は主にPlayday・Fox Fields（予備会場：Le Football City）。キックオフは金曜20:00、土曜16:00／18:00／19:30（日曜は悪天候等の予備日）。
          </div>

          <div style={{ fontWeight: '700', marginBottom: '4px' }}>■ 大会構成（3フェーズ）</div>
          <div style={{ marginBottom: '10px' }}>
            <b>フェーズ1・ランキングステージ（第1〜7週）</b>：スイス方式で7試合。初戦は上位6チーム・下位6チームに分かれて対戦し、第2週以降は毎週の順位に応じて対戦相手が決まる。<br />
            <b>フェーズ2・グループステージ（第8〜10週）</b>：フェーズ1の順位でポット分けし、抽選で3グループ（A/B/C）に振り分け。各グループ内で3試合総当たり。<br />
            <b>フェーズ3・カップステージ（第11〜12週）</b>：全チームが準決勝に進出し、成績に応じてSerie A／B／Cカップの3段階トーナメントに振り分けられる（早期敗退なし）。
          </div>

          <div style={{ fontWeight: '700', marginBottom: '4px' }}>■ 主なルール</div>
          <div>
            ・アマチュア限定。7人制（VietFootball）・11人制（Vリーグ等）の現役プロ選手は出場不可。元プロは引退後2年以上経過していれば出場可。<br />
            ・登録人数の上限なし。参加選手は試合前に顔写真の提出が必要（アマチュア資格・本人確認のため）。<br />
            ・1選手につき1シーズン1チームまで（移籍ウィンドウ期間中の公式移籍を除く）。移籍ウィンドウは第3〜4週・第7〜8週の2回。<br />
            ・試合日程は公表後変更不可。悪天候等リーグ側都合の中止以外は再調整なし。出場できない場合は不戦敗。<br />
            ・詳細ルール・懲罰規定は開幕前に公式ハンドブックとして別途配布予定。
          </div>
        </div>
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
                  const isUs = s.team_name === SJFC_NAME
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f0ebe5', background: isUs ? '#fef9e7' : 'transparent' }}>
                      <td style={{ padding: '8px 12px', fontWeight: isUs ? '700' : '400' }}>{i + 1}</td>
                      <td style={{ padding: '8px 12px', fontWeight: isUs ? '700' : '500', color: isUs ? '#e8a020' : '#2a2220' }}>{s.team_name}</td>
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
        {sefaMatches.length === 0 ? (
          <div style={{ color: '#8a7f7a', fontSize: '13px' }}>まだ試合記録がありません</div>
        ) : (
          sefaMatches.map(m => {
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
          })
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
                const isUs = s.team_name === SJFC_NAME
                const medals = ['🥇', '🥈', '🥉']
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f0ebe5', background: isUs ? '#fef9e7' : 'transparent' }}>
                    <td style={{ padding: '8px 12px' }}>{medals[i] || `${i + 1}`}</td>
                    <td style={{ padding: '8px 12px', fontWeight: isUs ? '700' : '500' }}>{s.player_name}</td>
                    <td style={{ padding: '8px 12px', color: isUs ? '#e8a020' : '#8a7f7a', fontWeight: isUs ? '700' : '400' }}>{s.team_name}</td>
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
