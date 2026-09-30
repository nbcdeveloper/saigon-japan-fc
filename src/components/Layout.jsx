import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'

const navItems = [
  { path: '/', icon: '⚽', label: 'ダッシュボード' },
  { path: '/sefa', icon: '/sefa-logo.png', label: 'SEFA S11' },
  { path: '/schedule', icon: '📅', label: 'スケジュール' },
  { path: '/results', icon: '🏆', label: '試合結果' },
  { path: '/members', icon: '👥', label: 'メンバー' },
  { path: '/attendance', icon: '📊', label: '出席率' },
  { path: '/announcements', icon: '📢', label: '掲示板' },
  { path: '/sponsors', icon: '🤝', label: '協賛' },
  { path: '/orgchart', icon: '🧑‍🤝‍🧑', label: '体制図' },
  { path: '/o40-policy', icon: '🧭', label: 'O-40活動方針' },
  { path: '/u40-policy', icon: '🎯', label: 'U-40活動方針' },
  { path: '/sns', icon: '📱', label: 'SNS' },
  { path: '/rules', icon: '📜', label: '規律と方針' },
  { path: '/admin', icon: '⚙️', label: '管理者設定' },
]

const tabItemsRow1 = [
  { path: '/', icon: '⚽', label: 'ホーム' },
  { path: '/schedule', icon: '📅', label: 'スケジュール' },
  { path: '/results', icon: '🏆', label: '試合結果' },
  { path: '/members', icon: '👥', label: 'メンバー' },
  { path: '/mypage', icon: '👤', label: 'マイページ' },
]

const tabItemsRow2 = [
  { path: '/sefa', icon: '/sefa-logo.png', label: 'SEFA' },
  { path: '/sponsors', icon: '🤝', label: '協賛' },
  { path: '/announcements', icon: '📢', label: '掲示板' },
  { path: '/admin', icon: '⚙️', label: '管理者画面' },
]

const menuItems = [
  { path: '/attendance', icon: '📊', label: '出席率' },
  { path: '/rules', icon: '📜', label: '規律と方針' },
  { path: '/o40-policy', icon: '🧭', label: 'O-40活動方針' },
  { path: '/u40-policy', icon: '🎯', label: 'U-40活動方針' },
  { path: '/orgchart', icon: '🧑‍🤝‍🧑', label: '体制図' },
  { path: '/sns', icon: '📱', label: 'SNS' },
]

// アイコンが画像パス（'/'始まり）ならimg、それ以外は絵文字として表示
const renderIcon = (icon, size) => {
  if (typeof icon === 'string' && icon.startsWith('/')) {
    return <img src={icon} alt="" style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
  }
  return <span style={{ fontSize: size }}>{icon}</span>
}

export default function Layout({ session }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0ebe5', width: '100%' }}>
      <aside className="sidebar" style={{
        width: '224px', background: '#2a2220', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, flexShrink: 0
      }}>
        <div style={{ textAlign: 'center', padding: '20px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <img src="/logo.jpg" alt="SJFC" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover' }} />
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '13px', color: '#e8c84a', letterSpacing: '1.5px', marginTop: '8px' }}>
            SAIGON JAPAN<br />FOOTBALL CLUB
          </div>
        </div>
        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
          {navItems.map(item => (
            <div key={item.path} onClick={() => navigate(item.path)} style={{
              display: 'flex', alignItems: 'center', gap: '9px', padding: '10px 18px', cursor: 'pointer',
              color: isActive(item.path) ? '#e8c84a' : 'rgba(245,242,238,0.62)',
              background: isActive(item.path) ? 'rgba(232,200,74,0.08)' : 'transparent',
              borderLeft: isActive(item.path) ? '3px solid #e8c84a' : '3px solid transparent',
              fontSize: '13px', fontWeight: '500', fontFamily: "'Noto Sans JP', sans-serif"
            }}>
              {renderIcon(item.icon, 16)}<span>{item.label}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div onClick={() => navigate('/mypage')} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0',
            cursor: 'pointer', color: isActive('/mypage') ? '#e8c84a' : 'rgba(245,242,238,0.5)',
            fontSize: '12px', marginBottom: '8px'
          }}>
            <span>👤</span><span>マイページ</span>
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>{session.user.email}</div>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '7px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px',
            color: 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit'
          }}>ログアウト</button>
        </div>
      </aside>

      <div className="main-content" style={{
        marginLeft: '224px', flex: 1, display: 'flex', flexDirection: 'column',
        minWidth: 0, overflow: 'hidden'
      }}>
        <div style={{
          background: '#2a2220', padding: '13px 26px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50
        }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', color: '#e8c84a', letterSpacing: '2px' }}>SAIGON JAPAN FC</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: "'Noto Sans JP', sans-serif" }}>2026-27 SEASON</div>
        </div>
        <div style={{ padding: '24px', flex: 1, minWidth: 0, overflow: 'auto' }}>
          <Outlet />
        </div>
      </div>

      <div className="mobile-tabbar" style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#2a2220', borderTop: '1px solid rgba(255,255,255,0.1)', zIndex: 200
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {tabItemsRow1.map(item => (
            <button key={item.path} onClick={() => navigate(item.path)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '8px 2px 6px', background: 'none', border: 'none', cursor: 'pointer',
              color: isActive(item.path) ? '#e8c84a' : 'rgba(245,242,238,0.5)',
              fontSize: '9.5px', fontWeight: '600', gap: '3px', fontFamily: 'inherit'
            }}>
              {renderIcon(item.icon, 20)}{item.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {tabItemsRow2.map(item => (
            <button key={item.path} onClick={() => navigate(item.path)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '8px 2px 6px', background: 'none', border: 'none', cursor: 'pointer',
              color: isActive(item.path) ? '#e8c84a' : 'rgba(245,242,238,0.5)',
              fontSize: '9.5px', fontWeight: '600', gap: '3px', fontFamily: 'inherit'
            }}>
              {renderIcon(item.icon, 20)}{item.label}
            </button>
          ))}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '8px 2px 6px', background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(245,242,238,0.5)', fontSize: '9.5px', fontWeight: '600', gap: '3px', fontFamily: 'inherit'
          }}>
            <span style={{ fontSize: '20px' }}>☰</span>メニュー
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150 }} onClick={() => setMenuOpen(false)} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#2a2220', borderRadius: '16px 16px 0 0', zIndex: 160, padding: '16px 0 130px' }}>
            <div style={{ width: '36px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '99px', margin: '0 auto 16px' }} />
            {menuItems.map(item => (
              <div key={item.path} onClick={() => { navigate(item.path); setMenuOpen(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', color: 'rgba(245,242,238,0.7)', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                <span style={{ fontSize: '18px' }}>{item.icon}</span>{item.label}
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          .sidebar { display: none !important; }
          .main-content { margin-left: 0 !important; padding-bottom: 116px; }
          .mobile-tabbar { display: block !important; }
        }
      `}</style>
    </div>
  )
}
