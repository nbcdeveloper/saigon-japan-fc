const PLATFORMS = [
  {
    key: 'facebook',
    name: 'Facebook',
    desc: '試合結果・お知らせ・イベントレポートなど',
    url: 'https://www.facebook.com/saigonjapanfc',
    cta: 'フォローする',
    bg: '#1877F2',
    icon: 'f',
  },
  {
    key: 'instagram',
    name: 'Instagram',
    desc: '練習・試合の写真、メンバー紹介など',
    url: 'https://www.instagram.com/saigonjapanfootballclub/',
    cta: 'フォローする',
    bg: 'linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)',
    icon: '📷',
  },
  {
    key: 'youtube',
    name: 'YouTube',
    desc: '試合ハイライト・ダイジェスト動画など',
    url: 'https://www.youtube.com/@saigonjapanfootballclub',
    cta: 'チャンネル登録',
    bg: '#FF0000',
    icon: '▶',
  },
]

export default function SNS() {
  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif", maxWidth: '720px' }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '2px', color: '#2a2220', marginBottom: '6px' }}>
        SNS
      </div>
      <div style={{ fontSize: '13px', color: '#8a7f7a', marginBottom: '22px', lineHeight: 1.6 }}>
        SJFCの最新情報や試合の様子は各SNSでも発信しています。ぜひフォローして応援してください！
      </div>

      {PLATFORMS.map(p => (
        <div key={p.key} style={{ background: 'white', borderRadius: '10px', padding: '18px 20px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', color: 'white', background: p.bg }}>
            {p.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#2a2220', marginBottom: '3px' }}>{p.name}</div>
            <div style={{ fontSize: '12.5px', color: '#8a7f7a', lineHeight: 1.5 }}>{p.desc}</div>
          </div>
          <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, padding: '9px 18px', background: '#2a2220', color: '#e8c84a', borderRadius: '6px', fontSize: '12.5px', fontWeight: '700', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            {p.cta}
          </a>
        </div>
      ))}
    </div>
  )
}
