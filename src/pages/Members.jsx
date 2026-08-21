import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('default')

  useEffect(() => { fetchMembers() }, [])

  const fetchMembers = async () => {
    // 退会済み（status='left'）のメンバーは名簿には表示しない
    const { data } = await supabase.from('profiles').select('*').neq('status', 'left').order('team').order('name')
    if (data) setMembers(data)
    setLoading(false)
  }

  const filtered = members.filter(m => {
    const matchTeam = filter === 'all' || m.team === filter
    const matchSearch = m.name?.includes(search) || m.position1?.includes(search)
    return matchTeam && matchSearch
  })

  // 並び替え: 標準（チーム→名前）／A-Z（ローマ字氏名優先、未入力は氏名で代用）／年齢順（生年が古い＝年上から）／入部順（入部年月が古い順、未入力は末尾）
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'az') {
      const an = (a.name_romaji || a.name || '').toUpperCase()
      const bn = (b.name_romaji || b.name || '').toUpperCase()
      return an.localeCompare(bn)
    }
    if (sortBy === 'age') {
      const aKey = a.birth_year ? a.birth_year * 10000 + (a.birth_month || 0) * 100 + (a.birth_day || 0) : 999999
      const bKey = b.birth_year ? b.birth_year * 10000 + (b.birth_month || 0) * 100 + (b.birth_day || 0) : 999999
      return aKey - bKey
    }
    if (sortBy === 'joined') {
      const aKey = a.joined_at || '9999-99-99'
      const bKey = b.joined_at || '9999-99-99'
      return aKey.localeCompare(bKey)
    }
    return 0
  })

  const sortTabStyle = (val) => ({
    padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
    cursor: 'pointer', border: '1.5px solid',
    borderColor: sortBy === val ? '#e8c84a' : '#ccc',
    background: sortBy === val ? '#2a2220' : 'transparent',
    color: sortBy === val ? '#e8c84a' : '#8a7f7a',
  })

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

  const teamInfo = (team) => team === 'u40'
    ? { label: 'U-40', color: '#7b5ea7', bg: '#ede8f7' }
    : { label: 'O-40', color: '#2a5fa5', bg: '#dceeff' }

  const tabStyle = (val) => ({
    padding: '6px 16px', borderRadius: '20px', fontSize: '12.5px', fontWeight: '700',
    cursor: 'pointer', border: '2px solid',
    borderColor: filter === val ? (val === 'u40' ? '#7b5ea7' : val === 'o40' ? '#2a5fa5' : '#2a2220') : '#ccc',
    background: filter === val ? (val === 'u40' ? '#7b5ea7' : val === 'o40' ? '#2a5fa5' : '#2a2220') : 'transparent',
    color: filter === val ? 'white' : '#8a7f7a',
  })

  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '2px', color: '#2a2220' }}>
          メンバー名簿
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'white', border: '1.5px solid #e0dbd5', borderRadius: '6px', padding: '8px 12px', marginBottom: '12px' }}>
        <span>🔍</span>
        <input type="text" placeholder="名前・ポジションで検索" value={search} onChange={e => setSearch(e.target.value)}
          style={{ border: 'none', outline: 'none', fontSize: '13px', width: '100%', fontFamily: 'inherit', background: 'transparent' }} />
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <div style={tabStyle('all')} onClick={() => setFilter('all')}>全員</div>
        <div style={tabStyle('u40')} onClick={() => setFilter('u40')}>U-40</div>
        <div style={tabStyle('o40')} onClick={() => setFilter('o40')}>O-40</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11.5px', color: '#8a7f7a', marginRight: '2px' }}>並び替え:</span>
        <div style={sortTabStyle('default')} onClick={() => setSortBy('default')}>標準</div>
        <div style={sortTabStyle('az')} onClick={() => setSortBy('az')}>A-Z</div>
        <div style={sortTabStyle('age')} onClick={() => setSortBy('age')}>年齢順（年上から）</div>
        <div style={sortTabStyle('joined')} onClick={() => setSortBy('joined')}>入部順（古いもの順）</div>
      </div>

      {loading ? (
        <div style={{ color: '#8a7f7a', fontSize: '13px' }}>読み込み中...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '10px', padding: '24px', textAlign: 'center', color: '#8a7f7a', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          メンバーが見つかりません
        </div>
      ) : (
        <>
          {/* PC: テーブル表示 */}
          <div className="hide-mobile" style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    {['名前', 'チーム', 'ポジション', 'Home #', 'Away #', '生年月日', '入部', 'ステータス'].map(h => (
                      <th key={h} style={{ background: '#2a2220', color: '#e8c84a', padding: '9px 12px', textAlign: 'left', fontSize: '12px', whiteSpace: 'nowrap', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(m => {
                    const t = teamInfo(m.team)
                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid #f0ebe5' }}>
                        <td style={{ padding: '9px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', whiteSpace: 'nowrap' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#2a2220', color: '#e8c84a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0, fontFamily: "'Bebas Neue', sans-serif" }}>
                              {m.name?.slice(0, 1)}
                            </div>
                            <div>
                              <div>{m.name}</div>
                              {m.name_romaji && <div style={{ fontSize: '10px', color: '#8a7f7a', fontWeight: '400' }}>{m.name_romaji}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ background: t.bg, color: t.color, fontSize: '10.5px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px' }}>{t.label}</span>
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ background: '#e8e0d8', color: '#2a2220', fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '3px', marginRight: '3px' }}>{m.position1}</span>
                          {m.position2 && <span style={{ background: '#e8e0d8', color: '#2a2220', fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '3px' }}>{m.position2}</span>}
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          {m.jersey_home ? <span style={{ background: '#f0f0f0', color: '#555', fontSize: '11px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px', border: '1px solid #ccc' }}>#{m.jersey_home}</span> : '－'}
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          {m.jersey_away ? <span style={{ background: '#d4f4e0', color: '#1a7a40', fontSize: '11px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px' }}>#{m.jersey_away}</span> : '－'}
                        </td>
                        <td style={{ padding: '9px 12px', color: '#8a7f7a', whiteSpace: 'nowrap' }}>
                          {m.birth_year ? (
                            <>
                              {`${m.birth_year}年${m.birth_month ? m.birth_month + '月' : ''}${m.birth_day ? m.birth_day + '日' : ''}`}
                              <span style={{ marginLeft: '5px', color: '#b3a89f', fontSize: '11px' }}>（{calcAge(m)}歳）</span>
                            </>
                          ) : '－'}
                        </td>
                        <td style={{ padding: '9px 12px', color: '#8a7f7a' }}>{m.joined_at ? m.joined_at.slice(0, 7).replace('-', '/') : '－'}</td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ background: m.status === 'active' ? '#d4f4e0' : '#fff3cd', color: m.status === 'active' ? '#1a7a40' : '#856404', fontSize: '11px', fontWeight: '600', padding: '2px 7px', borderRadius: '4px' }}>
                            {m.status === 'active' ? '在籍' : '休止中'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: '11.5px', color: '#8a7f7a', marginTop: '10px', textAlign: 'right' }}>
              全{members.length}名中 {filtered.length}名表示
            </div>
          </div>

          {/* モバイル: カード表示 */}
          <div className="show-mobile" style={{ display: 'none' }}>
            {sorted.map(m => {
              const t = teamInfo(m.team)
              return (
                <div key={m.id} style={{ background: 'white', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#2a2220', color: '#e8c84a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', flexShrink: 0, fontFamily: "'Bebas Neue', sans-serif" }}>
                      {m.name?.slice(0, 1)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{m.name}</div>
                      {m.name_romaji && <div style={{ fontSize: '10.5px', color: '#8a7f7a', marginBottom: '4px' }}>{m.name_romaji}</div>}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: m.name_romaji ? 0 : '4px' }}>
                        <span style={{ background: t.bg, color: t.color, fontSize: '10.5px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px' }}>{t.label}</span>
                        <span style={{ background: '#e8e0d8', color: '#2a2220', fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '3px' }}>{m.position1}</span>
                        {m.position2 && <span style={{ background: '#e8e0d8', color: '#2a2220', fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '3px' }}>{m.position2}</span>}
                        <span style={{ background: m.status === 'active' ? '#d4f4e0' : '#fff3cd', color: m.status === 'active' ? '#1a7a40' : '#856404', fontSize: '11px', fontWeight: '600', padding: '1px 6px', borderRadius: '4px' }}>
                          {m.status === 'active' ? '在籍' : '休止中'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                      {m.jersey_home && <span style={{ background: '#f0f0f0', color: '#555', fontSize: '11px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px', border: '1px solid #ccc' }}>👕#{m.jersey_home}</span>}
                      {m.jersey_away && <span style={{ background: '#d4f4e0', color: '#1a7a40', fontSize: '11px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px' }}>👕#{m.jersey_away}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#8a7f7a', borderTop: '1px solid #f0ebe5', paddingTop: '8px' }}>
                    {m.birth_year && <span>🎂 {m.birth_year}年{m.birth_month ? m.birth_month + '月' : ''}{m.birth_day ? m.birth_day + '日' : ''}（{calcAge(m)}歳）</span>}
                    {m.joined_at && <span>📅 入部 {m.joined_at.slice(0, 7).replace('-', '/')}</span>}
                  </div>
                </div>
              )
            })}
            <div style={{ fontSize: '11.5px', color: '#8a7f7a', textAlign: 'right', marginTop: '4px' }}>
              全{members.length}名中 {filtered.length}名表示
            </div>
          </div>
        </>
      )}
    </div>
  )
}
