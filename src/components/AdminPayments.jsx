import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
const YEAR = new Date().getFullYear()

// UTCではなくローカル時間（ベトナム時間）基準で「今日」の日付文字列を作る
const todayLocalStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function AdminPayments({ members }) {
  const [dues, setDues] = useState({})
  const [uniforms, setUniforms] = useState({})
  const [loading, setLoading] = useState(true)
  const [subTab, setSubTab] = useState('dues')

  useEffect(() => {
    if (members.length > 0) {
      fetchDues()
      fetchUniforms()
    }
  }, [members])

  const fetchDues = async () => {
    const { data } = await supabase.from('dues').select('*').eq('year', YEAR)
    if (data) {
      const map = {}
      data.forEach(d => {
        if (!map[d.member_id]) map[d.member_id] = {}
        map[d.member_id][d.month] = { paid: d.paid, id: d.id }
      })
      setDues(map)
    }
    setLoading(false)
  }

  const fetchUniforms = async () => {
    const { data } = await supabase.from('uniforms').select('*')
    if (data) {
      const map = {}
      data.forEach(u => { map[u.member_id] = u })
      setUniforms(map)
    }
  }

  const toggleDues = async (memberId, month) => {
    const existing = dues[memberId]?.[month]
    if (existing) {
      const newPaid = !existing.paid
      await supabase.from('dues').update({ paid: newPaid, paid_at: newPaid ? todayLocalStr() : null }).eq('id', existing.id)
      setDues(prev => ({
        ...prev,
        [memberId]: { ...prev[memberId], [month]: { ...existing, paid: newPaid } }
      }))
    } else {
      const { data } = await supabase.from('dues').insert({ member_id: memberId, year: YEAR, month, paid: true, paid_at: todayLocalStr() }).select().single()
      if (data) {
        setDues(prev => ({
          ...prev,
          [memberId]: { ...(prev[memberId] || {}), [month]: { paid: true, id: data.id } }
        }))
      }
    }
  }

  const toggleUniform = async (memberId, type) => {
    const existing = uniforms[memberId]
    const field = type === 'home' ? 'home_collected' : 'away_collected'
    const dateField = type === 'home' ? 'home_collected_at' : 'away_collected_at'
    const newVal = !existing?.[field]
    const today = todayLocalStr()

    if (existing) {
      await supabase.from('uniforms').update({ [field]: newVal, [dateField]: newVal ? today : null }).eq('member_id', memberId)
      setUniforms(prev => ({ ...prev, [memberId]: { ...prev[memberId], [field]: newVal } }))
    } else {
      const { data } = await supabase.from('uniforms').insert({ member_id: memberId, [field]: true, [dateField]: today }).select().single()
      if (data) setUniforms(prev => ({ ...prev, [memberId]: data }))
    }
  }

  const teamBadge = (team) => (
    <span style={{ background: team === 'u40' ? '#ede8f7' : '#dceeff', color: team === 'u40' ? '#7b5ea7' : '#2a5fa5', fontSize: '10.5px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px' }}>
      {team === 'u40' ? 'U-40' : 'O-40'}
    </span>
  )

  const subTabStyle = (t) => ({
    padding: '7px 18px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer',
    border: 'none', borderBottom: subTab === t ? '2px solid #2a2220' : '2px solid transparent',
    background: 'transparent', color: subTab === t ? '#2a2220' : '#8a7f7a'
  })

  if (loading) return <div style={{ color: '#8a7f7a', fontSize: '13px' }}>読み込み中...</div>

  return (
    <div>
      <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: '1px solid #e0dbd5' }}>
        <button style={subTabStyle('dues')} onClick={() => setSubTab('dues')}>💴 部費入金確認（{YEAR}年）</button>
        <button style={subTabStyle('uniforms')} onClick={() => setSubTab('uniforms')}>👕 ユニフォーム代徴収</button>
      </div>

      {/* 部費入金確認 */}
      {subTab === 'dues' && (
        <div style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: '12px', color: '#8a7f7a', marginBottom: '12px' }}>
            月をクリックして入金済み（緑）↔ 未入金を切替。都度払いの方は「－」表示。
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', minWidth: '900px' }}>
              <thead>
                <tr>
                  <th style={{ background: '#2a2220', color: '#e8c84a', padding: '9px 12px', textAlign: 'left', whiteSpace: 'nowrap', position: 'sticky', left: 0, zIndex: 3 }}>名前</th>
                  <th style={{ background: '#2a2220', color: '#e8c84a', padding: '9px 12px', textAlign: 'left', whiteSpace: 'nowrap' }}>チーム</th>
                  {MONTHS.map(m => (
                    <th key={m} style={{ background: '#2a2220', color: '#e8c84a', padding: '9px 6px', textAlign: 'center', fontSize: '11px', whiteSpace: 'nowrap' }}>{m}</th>
                  ))}
                  <th style={{ background: '#2a2220', color: '#e8c84a', padding: '9px 12px', textAlign: 'left', whiteSpace: 'nowrap' }}>区分</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => {
                  const memberDues = dues[m.id] || {}
                  const paidCount = Object.values(memberDues).filter(d => d.paid).length
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f0ebe5' }}>
                      <td style={{ padding: '9px 12px', fontWeight: '500', whiteSpace: 'nowrap', position: 'sticky', left: 0, zIndex: 1, background: 'white', boxShadow: '2px 0 4px rgba(0,0,0,0.06)' }}>{m.name}</td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{teamBadge(m.team)}</td>
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = i + 1
                        const dueInfo = memberDues[month]
                        const paid = dueInfo?.paid || false
                        return (
                          <td key={month} style={{ padding: '3px 3px', textAlign: 'center' }}>
                            {m.dues_type === 'spot' ? (
                              <span style={{ color: '#ccc', fontSize: '11px' }}>－</span>
                            ) : (
                              <div
                                onClick={() => toggleDues(m.id, month)}
                                style={{
                                  width: '30px', height: '24px', borderRadius: '5px', cursor: 'pointer',
                                  margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '12px', transition: 'all .15s',
                                  background: paid ? '#d4f4e0' : '#f0ebe5',
                                  border: paid ? '1.5px solid #27ae60' : '1.5px solid #e0dbd5',
                                  color: paid ? '#1a7a40' : '#ccc'
                                }}
                              >
                                {paid ? '✓' : ''}
                              </div>
                            )}
                          </td>
                        )
                      })}
                      <td style={{ padding: '9px 12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ background: m.dues_type === 'spot' ? '#fff3cd' : '#e8e0d8', color: m.dues_type === 'spot' ? '#856404' : '#8a7f7a', fontSize: '10px', fontWeight: '600', padding: '1px 5px', borderRadius: '3px' }}>
                            {m.dues_type === 'spot' ? '都度' : '月額'}
                          </span>
                          {m.dues_type === 'monthly' && (
                            <span style={{ fontSize: '10px', color: '#8a7f7a' }}>{paidCount}/12</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ユニフォーム代 */}
      {subTab === 'uniforms' && (
        <div style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: '12px', color: '#8a7f7a', marginBottom: '12px' }}>
            クリックして徴収済み（緑）↔ 未徴収を切替。
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['名前','チーム','ホーム（白）','アウェイ（緑）','状況'].map((h, i) => (
                    <th key={h} style={{ background: '#2a2220', color: '#e8c84a', padding: '9px 12px', textAlign: 'left', fontSize: '12px', whiteSpace: 'nowrap', ...(i === 0 ? { position: 'sticky', left: 0, zIndex: 3 } : {}) }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map(m => {
                  const u = uniforms[m.id] || {}
                  const homeOk = u.home_collected || false
                  const awayOk = u.away_collected || false
                  const bothOk = homeOk && awayOk
                  const noneOk = !homeOk && !awayOk
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f0ebe5' }}>
                      <td style={{ padding: '9px 12px', fontWeight: '500', whiteSpace: 'nowrap', position: 'sticky', left: 0, zIndex: 1, background: 'white', boxShadow: '2px 0 4px rgba(0,0,0,0.06)' }}>{m.name}</td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{teamBadge(m.team)}</td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        <div onClick={() => toggleUniform(m.id, 'home')}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '5px 12px', borderRadius: '6px', border: `1.5px solid ${homeOk ? '#27ae60' : '#e0dbd5'}`, background: homeOk ? '#d4f4e0' : '#fafafa', fontSize: '12.5px', fontWeight: '600', color: homeOk ? '#1a7a40' : '#8a7f7a' }}>
                          {homeOk ? '✅ 徴収済' : '⬜ 未徴収'}
                        </div>
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <div onClick={() => toggleUniform(m.id, 'away')}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '5px 12px', borderRadius: '6px', border: `1.5px solid ${awayOk ? '#27ae60' : '#e0dbd5'}`, background: awayOk ? '#d4f4e0' : '#fafafa', fontSize: '12.5px', fontWeight: '600', color: awayOk ? '#1a7a40' : '#8a7f7a' }}>
                          {awayOk ? '✅ 徴収済' : '⬜ 未徴収'}
                        </div>
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ background: bothOk ? '#d4f4e0' : noneOk ? '#fde8e6' : '#fff3cd', color: bothOk ? '#1a7a40' : noneOk ? '#c0392b' : '#856404', fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px' }}>
                          {bothOk ? '完了' : noneOk ? '未徴収' : '一部済'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
