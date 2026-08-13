import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('team')
      .order('name')
    if (data) setMembers(data)
    setLoading(false)
  }

  const filtered = members.filter(m => {
    const matchTeam = filter === 'all' || m.team === filter
    const matchSearch = m.name?.includes(search) || m.position1?.includes(search)
    return matchTeam && matchSearch
  })

  const teamInfo = (team) => {
    if (team === 'u40') return { label: 'U-40', color: '#7b5ea7', bg: '#ede8f7' }
    return { label: 'O-40', color: '#2a5fa5', bg: '#dceeff' }
  }

  const tabStyle = (val) => ({
    padding: '6px 16px', borderRadius: '20px', fontSize: '12.5px',
    fontWeight: '700', cursor: 'pointer', border: '2px solid',
    borderColor: filter === val
      ? (val === 'u40' ? '#7b5ea7' : val === 'o40' ? '#2a5fa5' : '#2a2220')
      : '#ccc',
    background: filter === val
      ? (val === 'u40' ? '#7b5ea7' : val === 'o40' ? '#2a5fa5' : '#2a2220')
      : 'transparent',
    color: filter === val ? 'white' : '#8a7f7a',
  })

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2a2220', letterSpacing: '2px' }}>
          メンバー名簿
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'white', border: '1.5px solid #e0dbd5', borderRadius: '6px', padding: '5px 11px' }}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="名前・ポジションで検索"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '12.5px', width: '160px' }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        <div style={tabStyle('all')} onClick={() => setFilter('all')}>全員</div>
        <div style={tabStyle('u40')} onClick={() => setFilter('u40')}>U-40</div>
        <div style={tabStyle('o40')} onClick={() => setFilter('o40')}>O-40</div>
      </div>

      <div style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        {loading ? (
          <div style={{ color: '#8a7f7a', fontSize: '13px' }}>読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: '#8a7f7a', fontSize: '13px' }}>メンバーが見つかりません</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['名前', 'チーム', 'ポジション', 'Home #', 'Away #', '生年', '入部', 'ステータス'].map(h => (
                    <th key={h} style={{ background: '#2a2220', color: '#e8c84a', padding: '9px 12px', textAlign: 'left', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => {
                  const t = teamInfo(m.team)
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f0ebe5' }}>
                      <td style={{ padding: '9px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                          <div style={{
                            width: '30px', height: '30px', borderRadius: '50%',
                            background: '#2a2220', color: '#e8c84a',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 'bold', flexShrink: 0
                          }}>
                            {m.name?.slice(0, 1)}
                          </div>
                          {m.name}
                        </div>
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ background: t.bg, color: t.color, fontSize: '10.5px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px' }}>
                          {t.label}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ background: '#e8e0d8', color: '#2a2220', fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '3px', marginRight: '3px' }}>
                          {m.position1}
                        </span>
                        {m.position2 && (
                          <span style={{ background: '#e8e0d8', color: '#2a2220', fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '3px' }}>
                            {m.position2}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        {m.jersey_home ? (
                          <span style={{ background: '#f0f0f0', color: '#555', fontSize: '11px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px', border: '1px solid #ccc' }}>
                            #{m.jersey_home}
                          </span>
                        ) : '－'}
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        {m.jersey_away ? (
                          <span style={{ background: '#d4f4e0', color: '#1a7a40', fontSize: '11px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px' }}>
                            #{m.jersey_away}
                          </span>
                        ) : '－'}
                      </td>
                      <td style={{ padding: '9px 12px', color: '#8a7f7a' }}>{m.birth_year ? m.birth_year + '年' : '－'}</td>
                      <td style={{ padding: '9px 12px', color: '#8a7f7a' }}>{m.joined_at ? m.joined_at.slice(0, 7).replace('-', '/') : '－'}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{
                          background: m.status === 'active' ? '#d4f4e0' : '#fff3cd',
                          color: m.status === 'active' ? '#1a7a40' : '#856404',
                          fontSize: '11px', fontWeight: '600', padding: '2px 7px', borderRadius: '4px'
                        }}>
                          {m.status === 'active' ? '在籍' : '休止中'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ fontSize: '11.5px', color: '#8a7f7a', marginTop: '10px', textAlign: 'right' }}>
          全{members.length}名中 {filtered.length}名表示
        </div>
      </div>
    </div>
  )
}
