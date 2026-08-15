import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const inputStyle = {
  width: '100%', padding: '8px 10px', border: '1.5px solid #e0dbd5',
  borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'inherit'
}

const labelStyle = {
  fontSize: '11.5px', fontWeight: '600', color: '#8a7f7a', display: 'block', marginBottom: '4px'
}

export default function MyPage() {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({
    name: '', name_romaji: '', position1: 'MF', position2: '', birth_year: '', birth_month: '', birth_day: '', joined_at: ''
  })
  const [pwForm, setPwForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [pwMessage, setPwMessage] = useState('')

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setProfile(data)
      setForm({
        name: data.name || '',
        name_romaji: data.name_romaji || '',
        position1: data.position1 || 'MF',
        position2: data.position2 || '',
        birth_year: data.birth_year || '',
        birth_month: data.birth_month || '',
        birth_day: data.birth_day || '',
        joined_at: data.joined_at?.slice(0, 7) || ''
      })
    }
    setLoading(false)
  }

  const saveProfile = async () => {
    if (!form.name) return setMessage('❌ 氏名は必須です')
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update({
      name: form.name,
      name_romaji: form.name_romaji || null,
      position1: form.position1,
      position2: form.position2 || null,
      birth_year: form.birth_year ? parseInt(form.birth_year) : null,
      birth_month: form.birth_month ? parseInt(form.birth_month) : null,
      birth_day: form.birth_day ? parseInt(form.birth_day) : null,
      joined_at: form.joined_at ? form.joined_at + '-01' : null,
    }).eq('id', user.id)
    setSaving(false)
    setMessage(error ? '❌ 保存に失敗しました' : '✅ プロフィールを保存しました')
    setTimeout(() => setMessage(''), 3000)
  }

  const savePassword = async () => {
    if (!pwForm.password) return setPwMessage('❌ パスワードを入力してください')
    if (pwForm.password !== pwForm.confirm) return setPwMessage('❌ パスワードが一致しません')
    if (pwForm.password.length < 6) return setPwMessage('❌ 6文字以上で入力してください')
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pwForm.password })
    setPwSaving(false)
    if (error) {
      setPwMessage('❌ パスワード変更に失敗しました')
    } else {
      setPwMessage('✅ パスワードを変更しました')
      setPwForm({ password: '', confirm: '' })
    }
    setTimeout(() => setPwMessage(''), 3000)
  }

  const teamLabel = (team) => team === 'u40'
    ? <span style={{ background: '#ede8f7', color: '#7b5ea7', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>U-40</span>
    : <span style={{ background: '#dceeff', color: '#2a5fa5', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>O-40</span>

  if (loading) return <div style={{ color: '#8a7f7a', fontSize: '13px' }}>読み込み中...</div>

  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif", maxWidth: '640px' }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '2px', color: '#2a2220', marginBottom: '20px' }}>
        マイページ
      </div>

      {/* プロフィール情報（読み取り専用） */}
      {profile && (
        <div style={{ background: '#2a2220', borderRadius: '10px', padding: '20px 24px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#e8c84a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', color: '#2a2220', flexShrink: 0 }}>
            {profile.name?.slice(0, 1) || '?'}
          </div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', color: 'white', letterSpacing: '1px' }}>{profile.name || '未設定'}</div>
            {profile.name_romaji && <div style={{ fontSize: '11.5px', color: '#c9beb5', marginTop: '2px' }}>{profile.name_romaji}</div>}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
              {profile.team && teamLabel(profile.team)}
              {profile.jersey_home && <span style={{ background: '#f0f0f0', color: '#555', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>Home #{profile.jersey_home}</span>}
              {profile.jersey_away && <span style={{ background: '#d4f4e0', color: '#1a7a40', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>Away #{profile.jersey_away}</span>}
              {profile.role === 'admin' && <span style={{ background: '#e8c84a', color: '#2a2220', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>ADMIN</span>}
            </div>
          </div>
        </div>
      )}

      {/* プロフィール編集 */}
      <div style={{ background: 'white', borderRadius: '10px', padding: '22px 24px', marginBottom: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '1.5px', marginBottom: '16px' }}>
          👤 プロフィール編集
        </div>
        <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>氏名 *</label>
            <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="例：田中 健太" />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>ローマ字氏名</label>
            <input style={inputStyle} value={form.name_romaji} onChange={e => setForm({ ...form, name_romaji: e.target.value })} placeholder="例：TANAKA Kenta" />
          </div>
          <div>
            <label style={labelStyle}>ポジション１</label>
            <select style={inputStyle} value={form.position1} onChange={e => setForm({ ...form, position1: e.target.value })}>
              {['GK','DF','MF','FW'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>ポジション２（任意）</label>
            <select style={inputStyle} value={form.position2} onChange={e => setForm({ ...form, position2: e.target.value })}>
              <option value="">－（なし）</option>
              {['GK','DF','MF','FW'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1/-1', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
            <div><label style={labelStyle}>生年</label>
              <select style={inputStyle} value={form.birth_year} onChange={e => setForm({ ...form, birth_year: e.target.value })}>
                <option value="">－</option>
                {Array.from({length:90},(_,i)=>new Date().getFullYear()-i).map(y=><option key={y} value={y}>{y}年</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>誕生月</label>
              <select style={inputStyle} value={form.birth_month} onChange={e => setForm({ ...form, birth_month: e.target.value })}>
                <option value="">－</option>
                {Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1}月</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>誕生日</label>
              <select style={inputStyle} value={form.birth_day} onChange={e => setForm({ ...form, birth_day: e.target.value })}>
                <option value="">－</option>
                {Array.from({length:31},(_,i)=><option key={i+1} value={i+1}>{i+1}日</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>入部年月</label>
            <input style={inputStyle} type="month" value={form.joined_at} onChange={e => setForm({ ...form, joined_at: e.target.value })} />
          </div>
        </div>
        {message && <div style={{ fontSize: '13px', marginBottom: '12px', color: message.includes('✅') ? '#27ae60' : '#e74c3c' }}>{message}</div>}
        <button onClick={saveProfile} disabled={saving}
          style={{ padding: '9px 20px', background: '#e8c84a', color: '#2a2220', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
          {saving ? '保存中...' : '保存する'}
        </button>
        <p style={{ fontSize: '11px', color: '#8a7f7a', marginTop: '10px' }}>※ チーム・背番号は管理者のみ変更できます</p>
      </div>

      {/* パスワード変更 */}
      <div style={{ background: 'white', borderRadius: '10px', padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '1.5px', marginBottom: '16px' }}>
          🔒 パスワード変更
        </div>
        <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>新しいパスワード</label>
            <input style={inputStyle} type="password" value={pwForm.password} onChange={e => setPwForm({ ...pwForm, password: e.target.value })} placeholder="6文字以上" />
          </div>
          <div>
            <label style={labelStyle}>確認（もう一度入力）</label>
            <input style={inputStyle} type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} placeholder="同じパスワードを入力" />
          </div>
        </div>
        {pwMessage && <div style={{ fontSize: '13px', marginBottom: '12px', color: pwMessage.includes('✅') ? '#27ae60' : '#e74c3c' }}>{pwMessage}</div>}
        <button onClick={savePassword} disabled={pwSaving}
          style={{ padding: '9px 20px', background: '#2a2220', color: '#e8c84a', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
          {pwSaving ? '変更中...' : 'パスワードを変更する'}
        </button>
      </div>
    </div>
  )
}
