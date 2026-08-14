import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Sponsors() {
  const [sponsors, setSponsors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSponsors() }, [])

  const fetchSponsors = async () => {
    const { data } = await supabase.from('sponsors').select('*').eq('is_active', true).order('sort_order')
    if (data) setSponsors(data)
    setLoading(false)
  }

  const categoryLabel = (cat) => {
    const map = { gold: { label: 'GOLD', color: '#e8c84a', bg: '#fef9e7' }, silver: { label: 'SILVER', color: '#888', bg: '#f5f5f5' }, general: { label: 'サポーター', color: '#2a5fa5', bg: '#dceeff' } }
    return map[cat] || map.general
  }

  if (loading) return <div style={{ color: '#8a7f7a', fontSize: '13px' }}>読み込み中...</div>

  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '2px', color: '#2a2220', marginBottom: '8px' }}>
        協賛・スポンサー
      </div>
      <div style={{ fontSize: '13px', color: '#8a7f7a', marginBottom: '24px' }}>
        Saigon Japan FCを応援してくださるスポンサー様をご紹介します。
      </div>

      {sponsors.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '10px', padding: '40px', textAlign: 'center', color: '#8a7f7a', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          現在スポンサー情報はありません
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {sponsors.map(sp => {
            const cat = categoryLabel(sp.category)
            return (
              <div key={sp.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: `2px solid ${cat.color}20` }}>
                {/* ヘッダー */}
                <div style={{ background: '#2a2220', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {sp.logo_url ? (
                    <img src={sp.logo_url} alt={sp.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', background: 'white' }} />
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#e8c84a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: '24px', color: '#2a2220', flexShrink: 0 }}>
                      {sp.name?.slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', color: 'white', letterSpacing: '1px' }}>{sp.name}</div>
                    <span style={{ background: cat.bg, color: cat.color, fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>{cat.label}</span>
                  </div>
                </div>

                {/* 内容 */}
                <div style={{ padding: '16px 20px' }}>
                  {sp.description && (
                    <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.6, marginBottom: '12px' }}>{sp.description}</div>
                  )}

                  {sp.benefits && (
                    <div style={{ background: '#fef9e7', borderRadius: '8px', padding: '12px 14px', marginBottom: '12px', borderLeft: '3px solid #e8c84a' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#8a7f7a', marginBottom: '5px', letterSpacing: '0.5px' }}>🎁 SJFC会員特典</div>
                      <div style={{ fontSize: '13px', color: '#2a2220', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{sp.benefits}</div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {sp.address && (
                      <div style={{ fontSize: '12px', color: '#8a7f7a', display: 'flex', gap: '6px' }}>
                        <span>📍</span><span>{sp.address}</span>
                      </div>
                    )}
                    {sp.phone && (
                      <div style={{ fontSize: '12px', color: '#8a7f7a', display: 'flex', gap: '6px' }}>
                        <span>📞</span><span>{sp.phone}</span>
                      </div>
                    )}
                    {sp.website_url && (
                      <a href={sp.website_url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '12px', color: '#2a5fa5', display: 'flex', gap: '6px', textDecoration: 'none' }}>
                        <span>🌐</span><span>{sp.website_url}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: '32px', background: '#2a2220', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px', color: '#e8c84a', letterSpacing: '2px', marginBottom: '8px' }}>
          BECOME A SPONSOR
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
          Saigon Japan FCでは協賛企業・スポンサーを募集しています。<br />
          ご興味のある方はチーム代表までお問い合わせください。
        </div>
      </div>
    </div>
  )
}
