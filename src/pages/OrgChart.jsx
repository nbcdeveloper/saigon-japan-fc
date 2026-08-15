import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function OrgChart() {
  const [rows, setRows] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [{ data: org }, { data: mem }] = await Promise.all([
      supabase.from('org_chart').select('*').order('section').order('sort_order'),
      supabase.from('profiles').select('id, name'),
    ])
    if (org) setRows(org)
    if (mem) setMembers(mem)
    setLoading(false)
  }

  const lastUpdated = rows.length > 0
    ? new Date(Math.max(...rows.map(r => new Date(r.updated_at || r.created_at).getTime())))
    : null

  const sectionInfo = (key) => {
    if (key === 'u40') return { label: 'U-40', color: '#7b5ea7' }
    if (key === 'o40') return { label: 'O-40', color: '#2a5fa5' }
    return { label: '本部', color: '#e8c84a' }
  }

  const SectionCard = ({ sectionKey }) => {
    const info = sectionInfo(sectionKey)
    const items = rows.filter(r => r.section === sectionKey)
    if (items.length === 0) return null
    return (
      <div style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '1px', color: '#2a2220', marginBottom: '12px' }}>
          <span style={{ color: info.color }}>■</span> {info.label}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map(item => {
            const memberNames = (item.member_ids || []).map(id => members.find(m => m.id === id)?.name).filter(Boolean)
            const extraNames = item.names ? item.names.split(/[、,]/).map(s => s.trim()).filter(Boolean) : []
            const allNames = [...memberNames, ...extraNames]
            return (
              <div key={item.id} style={{ display: 'flex', gap: '14px', alignItems: 'baseline', borderBottom: '1px solid #f0ebe5', paddingBottom: '8px' }}>
                <div style={{ minWidth: '150px', flexShrink: 0, fontWeight: '700', fontSize: '13px', color: '#2a2220' }}>{item.role_title}</div>
                <div style={{ fontSize: '13.5px', color: '#444' }}>{allNames.length > 0 ? allNames.join('、') : '（未定）'}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif", maxWidth: '720px' }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '2px', color: '#2a2220', marginBottom: '4px' }}>
        体制図
      </div>
      <div style={{ fontSize: '12px', color: '#8a7f7a', marginBottom: '20px' }}>
        Saigon Japan Football Club
        {lastUpdated && `　最終更新: ${lastUpdated.getFullYear()}年${lastUpdated.getMonth() + 1}月`}
      </div>

      {loading ? (
        <div style={{ color: '#8a7f7a', fontSize: '13px' }}>読み込み中...</div>
      ) : rows.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '10px', padding: '24px', textAlign: 'center', color: '#8a7f7a', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          まだ登録されていません
        </div>
      ) : (
        <>
          <SectionCard sectionKey="club" />
          <SectionCard sectionKey="u40" />
          <SectionCard sectionKey="o40" />
        </>
      )}
    </div>
  )
}
