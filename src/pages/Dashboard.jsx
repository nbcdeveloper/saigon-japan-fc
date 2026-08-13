import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, u40: 0, o40: 0 })
  const [events, setEvents] = useState([])

  useEffect(() => {
    fetchStats()
    fetchEvents()
  }, [])

  const fetchStats = async () => {
    const { data } = await supabase.from('profiles').select('team, status').eq('status', 'active')
    if (data) {
      setStats({
        total: data.length,
        u40: data.filter(m => m.team === 'u40').length,
        o40: data.filter(m => m.team === 'o40').length,
      })
    }
  }

  const fetchEvents = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('events').select('*').gte('event_date', today).order('event_date').limit(3)
    if (data) setEvents(data)
  }

  const catInfo = (cat) => {
    if (cat === 'u40') return { label: 'U-40', color: '#7b5ea7', bg: '#ede8f7' }
    if (cat === 'o40') return { label: 'O-40', color: '#2a5fa5', bg: '#dceeff' }
    return { label: '合同', color: '#e8a020', bg: '#fef3e2' }
  }

  const boxStyle = (borderColor) => ({
    background: 'white', borderRadius: '10px', padding: '16px 18px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderTop: '3px solid ' + borderColor
  })

  const cardStyle = {
    background: 'white', borderRadius: '10px', padding: '18px 22px',
    marginBottom: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2a2220', letterSpacing: '2px', marginBottom: '20px' }}>
        DASHBOARD
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '20px' }}>
        <div style={boxStyle('#e8c84a')}>
          <div style={{ fontSize: '36px', fontFamily: 'serif', color: '#2a2220', lineHeight: 1 }}>{stats.total}</div>
          <div style={{ fontSize: '11.5px', color: '#8a7f7a', marginTop: '3px' }}>登録メンバー</div>
        </div>
        <div style={boxStyle('#7b5ea7')}>
          <div style={{ fontSize: '18px', fontFamily: 'serif', color: '#2a2220', lineHeight: 1.4 }}>
            <span style={{ color: '#7b5ea7' }}>U-40</span> {stats.u40}名<br />
            <span style={{ color: '#2a5fa5' }}>O-40</span> {stats.o40}名
          </div>
          <div style={{ fontSize: '11.5px', color: '#8a7f7a', marginTop: '3px' }}>チーム内訳</div>
        </div>
        <div style={boxStyle('#27ae60')}>
          <div style={{ fontSize: '36px', fontFamily: 'serif', color: '#2a2220', lineHeight: 1 }}>－</div>
          <div style={{ fontSize: '11.5px', color: '#8a7f7a', marginTop: '3px' }}>今期成績</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#2a2220', marginBottom: '12px' }}>
            📅 直近のスケジュール
          </div>
          {events.length === 0 && <div style={{ color: '#8a7f7a', fontSize: '13px' }}>予定はありません</div>}
          {events.map(ev => {
            const cat = catInfo(ev.category)
            const d = new Date(ev.event_date)
            return (
              <div key={ev.id} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                borderRadius: '8px', padding: '12px 14px', marginBottom: '8px',
                borderLeft: '4px solid #e8c84a', background: '#fafafa',
                boxShadow: '0 1px 3px rgba(0,0,0,0.07)'
              }}>
                <div style={{ textAlign: 'center', minWidth: '36px' }}>
                  <div style={{ fontSize: '22px', fontFamily: 'serif', lineHeight: 1, color: '#2a2220' }}>
                    {d.getDate()}
                  </div>
                  <div style={{ fontSize: '9px', color: '#8a7f7a', textTransform: 'uppercase' }}>
                    {d.toLocaleString('en', { month: 'short' })}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{ev.title}</div>
                  <div style={{ fontSize: '11px', color: '#8a7f7a', marginTop: '2px' }}>
                    {ev.venue || '場所未定'} {ev.kickoff_time ? '/ ' + ev.kickoff_time.slice(0,5) : ''}
                  </div>
                </div>
                <span style={{
                  background: cat.bg, color: cat.color,
                  fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px'
                }}>
                  {cat.label}
                </span>
              </div>
            )
          })}
        </div>

        <div>
          <div style={cardStyle}>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#2a2220', marginBottom: '10px' }}>
              <span style={{ color: '#7b5ea7' }}>■</span> U-40 出席率 トップ5
            </div>
            <div style={{ color: '#8a7f7a', fontSize: '12px' }}>メンバー登録後に表示されます</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#2a2220', marginBottom: '10px' }}>
              <span style={{ color: '#2a5fa5' }}>■</span> O-40 出席率 トップ5
            </div>
            <div style={{ color: '#8a7f7a', fontSize: '12px' }}>メンバー登録後に表示されます</div>
          </div>
        </div>
      </div>
    </div>
  )
}
