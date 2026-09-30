import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'

const navItems = [
  { path: '/', icon: '⚽', label: 'ダッシュボード' },
  { path: '/schedule', icon: '📅', label: 'スケジュール' },
  { path: '/results', icon: '🏆', label: '試合結果' },
  { path: '/members', icon: '👥', label: 'メンバー' },
  { path: '/attendance', icon: '📊', label: '出席率' },
  { path: '/announcements', icon: '📢', label: '掲示板' },
  { path: '/sponsors', icon: '🤝', label: '協賛' },
  { path: '/orgchart', icon: '🏢', label: '体制図' },
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
  { path: '/sponsors', icon: '🤝', label: '協賛' },
  { path: '/announcements', icon: '📢', label: '掲示板' },
  { path: '/admin', icon: '⚙️', label: '管理画面' },
]

const menuItems = [
  { path: '/attendance', icon: '📊', label: '出席率' },
  { path: '/orgchart', icon: '🏢', label: '体制図' },
]

const renderIcon = (icon, size) => {
  if (typeof icon === 'string' && icon.startsWith('/')) {
    return <img src={icon} alt="" style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
  }
  return <span style={{ fontSize: size }}>{icon}</span>
}

export default function Layout({ profile }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  // チーム設定（将来的にDBから取得）
  const teamName = profile?.teams?.name || 'MyPitch'
  const teamColor = profile?.teams?.primary_color || '#c9a84c'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f0eb', fontFamily: "'Noto Sans JP', sans-serif" }}>

      {/* サイドバー（PC） */}
      <aside style={{
        width: 200, background: '#2a2220', color: '#fff',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        overflowY: 'auto'
      }}
        className="hidden-mobile"
      >
        {/* ロゴエリア */}
        <div style={{ padding: '24px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            border: `3px solid ${teamColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px', fontSize: 28, background: 'rgba(255,255,255,0.05)'
          }}>⚽</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: teamColor, letterSpacing: 1 }}>{teamName}</div>
        </div>

        {/* ナビ */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map(function(item) {
            var active = isActive(item.path)
            return (
              <button key={item.path} onClick={function() { navigate(item.path) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 20px', background: active ? 'rgba(201,168,76,0.15)' : 'none',
                  border: 'none', borderLeft: active ? `3px solid ${teamColor}` : '3px solid transparent',
                  color: active ? teamColor : '#a09088', fontSize: 13,
                  fontWeight: active ? 700 : 400, cursor: 'pointer', textAlign: 'left'
                }}>
                {renderIcon(item.icon, 18)}
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* ユーザーエリア */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 12, color: '#a09088', marginBottom: 8 }}>{profile?.name || ''}</div>
          <button onClick={handleLogout}
            style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)', color: '#a09088', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
            ログアウト
          </button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <div style={{ marginLeft: 200, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* ヘッダー */}
        <header style={{
          background: '#2a2220', color: '#fff',
          padding: '0 24px', height: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 40
        }}>
          <div style={{ color: teamColor, fontWeight: 800, fontSize: 15, letterSpacing: 2, textTransform: 'uppercase' }}>
            {teamName}
          </div>
          <div style={{ fontSize: 12, color: '#a09088' }}>
            {new Date().getFullYear()}-{String(new Date().getFullYear() + 1).slice(2)} SEASON
          </div>
        </header>

        {/* ページコンテンツ */}
        <main style={{ flex: 1, padding: '24px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
        }
        @media (min-width: 769px) {
          .show-mobile-only { display: none !important; }
        }
      `}</style>
    </div>
  )
}
