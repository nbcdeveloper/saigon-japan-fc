import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'

const navItems = [
  { path: '/', icon: '⚽', label: 'ダッシュボード' },
  { path: '/schedule', icon: '📅', label: 'スケジュール' },
  { path: '/results', icon: '🏆', label: '試合結果' },
  { path: '/attendance', icon: '📊', label: '出席率' },
  { path: '/members', icon: '👥', label: 'メンバー' },
  { path: '/announcements', icon: '📢', label: '掲示板' },
  { path: '/admin', icon: '⚙️', label: '管理者設定' },
]

const tabItems = [
  { path: '/', icon: '⚽', label: 'ホーム' },
  { path: '/schedule', icon: '📅', label: 'スケジュール' },
  { path: '/results', icon: '🏆', label: '試合' },
  { path: '/members', icon: '👥', label: 'メンバー' },
]

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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0ebe5' }}>

      {/* SIDEBAR (PC) */}
      <aside className="sidebar" style={{
        width: '224px', background: '#2a2220', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, flexShrink: 0
      }}>
        <div style={{ textAlign: 'center', padding: '20px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <img src="/logo.jpg" alt="SJFC"
            style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover' }} />
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#e8c84a', letterSpacing: '1.5px', marginTop: '8px' }}>
            SAIGON JAPAN<br />FOOTBALL CLUB
          </div>
        </div>
        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
          {navItems.map(item => (
            <div key={item.path} onClick={() => navigate(item.path)} style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              padding: '10px 18px', cursor: 'pointer',
              color: isActive(item.path) ? '#e8c84a' : 'rgba(245,242,238,0.62)',
              background: isActive(item.path) ? 'rgba(232,200,74,0.08)' : 'transparent',
              borderLeft: isActive(item.path) ? '3px solid #e8c84a' : '3px solid transparent',
              fontSize: '13px', fontWeight: '500'
            }}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
            {session.user.email}
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '7px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px',
            color: 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer'
          }}>
            ログアウト
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-content" style={{
        marginLeft: '224px', flex: 1, display: 'flex', flexDirection: 'column',
        minWidth: 0, width: 'calc(100% - 224px)', boxSizing: 'border-box'
      }}>
        <div style={{
          background: '#2a2220', padding: '13px 26px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e8c84a', letterSpacing: '2px' }}>
            SAIGON JAPAN FC
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            2026-27 SEASON
          </div>
        </div>
        <div style={{ padding: '24px', flex: 1, minWidth: 0, boxSizing: 'border-box', width: '100%' }}>
          <Outlet />
        </div>
      </div>

      {/* MOBILE TAB BAR */}
      <div className="mobile-tabbar" style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#2a2220', borderTop: '1px solid rgba(255,255,255,0.1)', zIndex: 200
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {tabItems.map(item => (
            <button key={item.path} onClick={() => navigate(item.path)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '8px 2px 6px', background: 'none', border: 'none', cursor: 'pointer',
              color: isActive(item.path) ? '#e8c84a' : 'rgba(245,242,238,0.5)',
              fontSize: '9.5px', fontWeight: '600', gap: '3px'
            }}>
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '8px 2px 6px', background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(245,242,238,0.5)', fontSize: '9.5px', fontWeight: '600', gap: '3px'
          }}>
            <span style={{ fontSize: '20px' }}>☰</span>
            メニュー
          </button>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {menuOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150 }} onClick={() => setMenuOpen(false)} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#2a2220', borderRadius: '16px 16px 0 0', zIndex: 160, padding: '16px 0 80px' }}>
            <div style={{ width: '36px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '99px', margin: '0 auto 16px' }} />
            {[
              { path: '/attendance', icon: '📊', label: '出席率' },
              { path: '/announcements', icon: '📢', label: '掲示板' },
              { path: '/admin', icon: '⚙️', label: '管理者設定' },
            ].map(item => (
              <div key={item.path} onClick={() => { navigate(item.path); setMenuOpen(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', color: 'rgba(245,242,238,0.7)', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          .sidebar { display: none !important; }
          .main-content { margin-left: 0 !important; width: 100% !important; padding-bottom: 64px; }
          .mobile-tabbar { display: block !important; }
        }
      `}</style>
    </div>
  )
}
