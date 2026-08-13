import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Announcements() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', pinned: false })
  const [editPost, setEditPost] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: p } = await supabase.from('profiles').select('name, role').eq('id', user.id).single()
      if (p) { setProfile(p); setIsAdmin(p.role === 'admin') }
    }
    const { data } = await supabase.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false })
    if (data) setPosts(data)
    setLoading(false)
  }

  const openAdd = () => { setEditPost(null); setForm({ title: '', body: '', pinned: false }); setModal(true) }
  const openEdit = (post) => { setEditPost(post); setForm({ title: post.title, body: post.body, pinned: post.pinned }); setModal(true) }

  const save = async () => {
    if (!form.title || !form.body) return alert('タイトルと本文は必須です')
    const { data: { user } } = await supabase.auth.getUser()
    const payload = { ...form, author_name: profile?.name || '管理者', author_id: user.id }
    if (editPost) {
      await supabase.from('announcements').update(payload).eq('id', editPost.id)
    } else {
      await supabase.from('announcements').insert(payload)
    }
    setModal(false)
    fetchAll()
  }

  const deletePost = async (id) => {
    if (!window.confirm('削除しますか？')) return
    await supabase.from('announcements').delete().eq('id', id)
    fetchAll()
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })

  const inputStyle = { width: '100%', padding: '8px 10px', border: '1.5px solid #e0dbd5', borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }
  const labelStyle = { fontSize: '11.5px', fontWeight: '600', color: '#8a7f7a', display: 'block', marginBottom: '4px' }

  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '2px', color: '#2a2220' }}>
          掲示板・お知らせ
        </div>
        {isAdmin && (
          <button onClick={openAdd} style={{ padding: '7px 14px', background: '#2a2220', color: '#e8c84a', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}>
            ＋ 投稿
          </button>
        )}
      </div>

      {loading ? <div style={{ color: '#8a7f7a', fontSize: '13px' }}>読み込み中...</div> :
        posts.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '10px', padding: '40px', textAlign: 'center', color: '#8a7f7a', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>投稿がありません</div>
        ) : posts.map(post => (
          <div key={post.id} style={{
            background: 'white', borderRadius: '8px', padding: '16px 20px', marginBottom: '10px',
            borderLeft: `4px solid ${post.pinned ? '#e74c3c' : '#e8c84a'}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                  {post.pinned && <span style={{ fontSize: '12px' }}>📌</span>}
                  {post.title}
                </div>
                <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{post.body}</div>
                <div style={{ fontSize: '11px', color: '#8a7f7a', marginTop: '10px' }}>
                  👤 {post.author_name}　📅 {formatDate(post.created_at)}
                </div>
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => openEdit(post)} style={{ padding: '4px 9px', background: 'transparent', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '11.5px', cursor: 'pointer' }}>編集</button>
                  <button onClick={() => deletePost(post.id)} style={{ padding: '4px 9px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11.5px', cursor: 'pointer' }}>削除</button>
                </div>
              )}
            </div>
          </div>
        ))
      }

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={() => setModal(false)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '26px', width: '480px', maxWidth: '92vw', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '19px', letterSpacing: '1.5px', marginBottom: '16px' }}>
              {editPost ? '✏️ 編集' : '📢 新規投稿'}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={labelStyle}>タイトル *</label>
              <input style={inputStyle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="タイトルを入力" />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>本文 *</label>
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={5} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="内容を入力してください" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <input type="checkbox" id="pinned" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })} />
              <label htmlFor="pinned" style={{ fontSize: '13px', cursor: 'pointer' }}>📌 重要（ピン留め）</label>
            </div>
            <div style={{ display: 'flex', gap: '9px', justifyContent: 'flex-end' }}>
              <button style={{ padding: '7px 14px', background: 'transparent', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '12.5px', cursor: 'pointer' }} onClick={() => setModal(false)}>キャンセル</button>
              <button style={{ padding: '7px 14px', background: '#e8c84a', color: '#2a2220', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }} onClick={save}>
                {editPost ? '保存する' : '投稿する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
