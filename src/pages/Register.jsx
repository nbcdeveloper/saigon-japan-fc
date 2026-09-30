import { useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [teamName, setTeamName] = useState('')
  const [teamSlug, setTeamSlug] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. ユーザー作成
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw authError
      const userId = authData.user.id

      // 2. チーム作成
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({ name: teamName, slug: teamSlug, plan: 'free', owner_id: userId, primary_color: '#c9a84c' })
        .select().single()
      if (teamError) throw teamError

      // 3. team_settingsを作成
      await supabase.from('team_settings').insert({ team_id: teamData.id })

      // 4. プロフィール作成
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId, team_id: teamData.id, name, email,
        role: 'owner', is_admin: true, status: 'active'
      })
      if (profileError) throw profileError

      setStep(3)
    } catch (err) {
      setError(err.message || '登録に失敗しました')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    border: '1.5px solid #e0dbd5', borderRadius: '8px',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    fontFamily: "'Noto Sans JP', sans-serif"
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#2a2220', fontFamily: "'Noto Sans JP', sans-serif",
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* ロゴ */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚽</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#e8c84a', letterSpacing: 2 }}>MyPitch</div>
          <div style={{ fontSize: 12, color: '#a09088', marginTop: 4, letterSpacing: 1 }}>SOCCER TEAM MANAGEMENT</div>
        </div>

        {/* ステップインジケーター */}
        {step < 3 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: step >= s ? '#e8c84a' : 'rgba(255,255,255,0.1)',
                  color: step >= s ? '#2a2220' : '#666',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800
                }}>{s}</div>
                <span style={{ fontSize: 12, color: step >= s ? '#e8c84a' : '#666' }}>
                  {s === 1 ? 'チーム情報' : 'アカウント'}
                </span>
                {s < 2 && <div style={{ width: 20, height: 1, background: '#444' }} />}
              </div>
            ))}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: 12, padding: '36px 32px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

          {step === 3 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#2a2220', marginBottom: 8 }}>登録完了！</div>
              <div style={{ fontSize: 13, color: '#8a7f7a', marginBottom: 24, lineHeight: 1.7 }}>
                「{teamName}」のアカウントが作成されました。<br />
                メールの確認後、ログインしてください。
              </div>
              <button onClick={() => navigate('/login')}
                style={{ width: '100%', padding: '12px', background: '#2a2220', color: '#e8c84a', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 1 }}>
                ログインへ
              </button>
            </div>
          ) : (
            <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2) } : handleRegister}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#2a2220', marginBottom: 20 }}>
                {step === 1 ? '⚽ チーム情報を入力' : '👤 アカウント情報を入力'}
              </div>

              {step === 1 && (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#8a7f7a', display: 'block', marginBottom: 6 }}>チーム名 *</label>
                    <input value={teamName} onChange={e => {
                      setTeamName(e.target.value)
                      setTeamSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                    }} required placeholder="例: Tokyo United FC" style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#8a7f7a', display: 'block', marginBottom: 6 }}>チームID（URL用）*</label>
                    <input value={teamSlug} onChange={e => setTeamSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      required placeholder="例: tokyo-united-fc" style={inputStyle} />
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>英数字とハイフンのみ</div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#8a7f7a', display: 'block', marginBottom: 6 }}>お名前 *</label>
                    <input value={name} onChange={e => setName(e.target.value)} required placeholder="山田 太郎" style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#8a7f7a', display: 'block', marginBottom: 6 }}>メールアドレス *</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="example@email.com" style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#8a7f7a', display: 'block', marginBottom: 6 }}>パスワード *</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="8文字以上" minLength={8} style={inputStyle} />
                  </div>
                </>
              )}

              {error && (
                <div style={{ background: '#fde8e6', color: '#c0392b', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                {step === 2 && (
                  <button type="button" onClick={() => setStep(1)}
                    style={{ flex: 1, padding: '12px', background: '#f5f0eb', color: '#8a7f7a', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
                    戻る
                  </button>
                )}
                <button type="submit" disabled={loading}
                  style={{ flex: 2, padding: '12px', background: '#2a2220', color: '#e8c84a', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 1 }}>
                  {loading ? '処理中...' : step === 1 ? '次へ →' : 'チームを登録する'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontSize: 13, color: '#a09088' }}>すでにアカウントをお持ちの方は </span>
          <a href="/login" style={{ fontSize: 13, color: '#e8c84a', textDecoration: 'none', fontWeight: 700 }}>ログイン</a>
        </div>
      </div>
    </div>
  )
}
