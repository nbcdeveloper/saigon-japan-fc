import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('メールアドレスまたはパスワードが違います')
    setLoading(false)
  }

  return (
    <div style={{
      display:'flex',alignItems:'center',justifyContent:'center',
      minHeight:'100vh',background:'#2a2220',fontFamily:'sans-serif'
    }}>
      <div style={{
        background:'white',borderRadius:'12px',padding:'40px',
        width:'360px',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <div style={{fontSize:'28px',fontWeight:'bold',color:'#2a2220',letterSpacing:'2px'}}>
            SJFC
          </div>
          <div style={{fontSize:'13px',color:'#8a7f7a',marginTop:'4px'}}>
            Saigon Japan Football Club
          </div>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{marginBottom:'14px'}}>
            <label style={{fontSize:'12px',fontWeight:'600',color:'#8a7f7a',display:'block',marginBottom:'4px'}}>
              メールアドレス
            </label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
              style={{width:'100%',padding:'10px',border:'1.5px solid #e0dbd5',borderRadius:'6px',fontSize:'14px',outline:'none'}}
            />
          </div>
          <div style={{marginBottom:'20px'}}>
            <label style={{fontSize:'12px',fontWeight:'600',color:'#8a7f7a',display:'block',marginBottom:'4px'}}>
              パスワード
            </label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
              style={{width:'100%',padding:'10px',border:'1.5px solid #e0dbd5',borderRadius:'6px',fontSize:'14px',outline:'none'}}
            />
          </div>
          {error && (
            <div style={{background:'#fde8e6',color:'#c0392b',padding:'10px',borderRadius:'6px',fontSize:'13px',marginBottom:'14px'}}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading}
            style={{
              width:'100%',padding:'12px',background:'#2a2220',
              color:'#e8c84a',border:'none',borderRadius:'6px',
              fontSize:'14px',fontWeight:'700',cursor:'pointer',letterSpacing:'1px'
            }}>
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  )
}