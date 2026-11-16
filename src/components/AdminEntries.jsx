import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

// 管理者画面「入部申請」タブ
// ・公開フォーム(/entry)から届いた申込の確認 → 承認（アカウント自動作成）/ 却下
// ・電話番号・緊急連絡先は entry_applications（管理者のみ閲覧可）にだけ保存されている

const GOLD = '#e8c84a'
const LINE = '#e0dbd5'

const box = { background: 'white', border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, marginBottom: 12 }
const btn = (bg, fg = '#2a2220') => ({ background: bg, color: fg, border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer' })
const input = { background: '#faf7f3', color: '#2a2220', border: `1px solid ${LINE}`, borderRadius: 8, padding: '8px 10px', fontSize: 15, boxSizing: 'border-box' }

const STATUS_LABEL = { pending: '承認待ち', approved: '承認済み', rejected: '却下' }

const ageOf = (str) => {
  const b = new Date(str + 'T00:00:00')
  if (Number.isNaN(b.getTime())) return '-'
  const t = new Date()
  let a = t.getFullYear() - b.getFullYear()
  const m = t.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--
  return a
}

const fmtDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function Row({ k, v, tel }) {
  if (!v) return null
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 14, lineHeight: 1.7 }}>
      <div style={{ width: 118, flexShrink: 0, color: '#8a7f7a' }}>{k}</div>
      <div style={{ flex: 1, wordBreak: 'break-all' }}>
        {tel ? <a href={`tel:${String(v).replace(/[^0-9+]/g, '')}`} style={{ color: '#8a6d00', fontWeight: 600 }}>{v}</a> : v}
      </div>
    </div>
  )
}

export default function AdminEntries({ onChanged }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('pending')
  const [openId, setOpenId] = useState(null)        // 承認パネルを開いている申請
  const [rejectId, setRejectId] = useState(null)    // 却下パネルを開いている申請
  const [memberNo, setMemberNo] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)        // 承認結果（仮パスワードは一度だけ表示）
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: e } = await supabase
      .from('entry_applications')
      .select('*')
      .order('created_at', { ascending: false })
    if (e) setError('読み込みに失敗しました：' + e.message)
    else { setError(''); setRows(data || []) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // 部員番号の候補：いちばん大きい番号+1。まだ誰にも付いていなければ「登録メンバー数+1」
  const suggestMemberNo = async () => {
    const { data: top } = await supabase
      .from('profiles').select('member_no').not('member_no', 'is', null)
      .order('member_no', { ascending: false }).limit(1)
    if (top && top.length) return top[0].member_no + 1
    const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
    return (count || 0) + 1
  }

  const openApprove = async (r) => {
    setRejectId(null); setResult(null); setCopied(false)
    setOpenId(r.id)
    setMemberNo(String(await suggestMemberNo()))
  }

  const approve = async (r) => {
    const no = parseInt(memberNo, 10)
    if (!Number.isInteger(no) || no <= 0) return setError('部員番号は1以上の数字で入力してください')
    setBusy(true); setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/approve-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ id: r.id, member_no: no }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error || '承認に失敗しました'); return }
      setResult({ id: r.id, name: r.name, email: json.email, password: json.password, member_no: json.member_no, reused: json.reused })
      setOpenId(null)
      await load()
      onChanged && onChanged()
    } catch {
      setError('通信に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  const reject = async (r) => {
    setBusy(true); setError('')
    const { data, error: e } = await supabase
      .from('entry_applications')
      .update({ status: 'rejected', reject_reason: rejectReason.trim() || null })
      .eq('id', r.id).eq('status', 'pending')
      .select()
    setBusy(false)
    if (e) return setError('却下に失敗しました：' + e.message)
    if (!data || data.length === 0) return setError('却下できませんでした（権限がないか、すでに処理済みです）')
    setRejectId(null); setRejectReason('')
    await load()
    onChanged && onChanged()
  }

  const remove = async (r) => {
    if (!window.confirm(`${r.name} さんの申込データを完全に削除します。元に戻せません。よろしいですか？`)) return
    const { data, error: e } = await supabase.from('entry_applications').delete().eq('id', r.id).select()
    if (e) return setError('削除に失敗しました：' + e.message)
    if (!data || data.length === 0) return setError('削除できませんでした（権限がありません）')
    await load()
  }

  const loginText = (x) =>
    `【SJFCサイト ログイン情報】\n${x.name} さん、入部ありがとうございます！\n\nURL：https://saigonjapanfc.com\nメールアドレス：${x.email}\n仮パスワード：${x.password}\n\nログイン後、マイページからパスワードを変更してください。`

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setCopied(true) } catch { setError('コピーできませんでした。手で選択してコピーしてください') }
  }

  const list = rows.filter((r) => r.status === filter)
  const count = (s) => rows.filter((r) => r.status === s).length

  return (
    <div>
      <p style={{ fontSize: 13, color: '#8a7f7a', lineHeight: 1.7, margin: '0 0 12px' }}>
        入部フォーム（saigonjapanfc.com/entry）から届いた申込です。電話番号・緊急連絡先は管理者だけに表示されます。
        承認するとログインアカウントとメンバー登録が自動で作られます。
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {['pending', 'approved', 'rejected'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ ...btn(filter === s ? GOLD : '#faf7f3', filter === s ? '#2a2220' : '#2a2220'), border: `1px solid ${filter === s ? GOLD : LINE}` }}>
            {STATUS_LABEL[s]}（{count(s)}）
          </button>
        ))}
        <button onClick={load} style={{ ...btn('#faf7f3', '#2a2220'), border: `1px solid ${LINE}` }}>更新</button>
      </div>

      {error && <div style={{ background: '#fde8e6', border: '1px solid #e8a59d', color: '#c0392b', borderRadius: 8, padding: '10px 12px', fontSize: 14, marginBottom: 12 }}>{error}</div>}

      {result && (
        <div style={{ ...box, border: `2px solid ${GOLD}` }}>
          <div style={{ color: '#1a7a40', fontWeight: 800, marginBottom: 6 }}>{result.name} さんを承認しました（部員番号 {result.member_no}）</div>
          <p style={{ fontSize: 13, color: '#5a4f4a', lineHeight: 1.7, margin: '0 0 8px' }}>
            仮パスワードはこの画面でしか表示されません。下の文面をコピーして、本人にLINE等でお送りください。
            {result.reused && '（このメールアドレスのログインはすでに存在していたため、パスワードを新しく設定し直しました）'}
          </p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#faf7f3', border: `1px solid ${LINE}`, borderRadius: 8, padding: 10, fontSize: 14, margin: '0 0 8px', fontFamily: 'inherit' }}>{loginText(result)}</pre>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn(GOLD)} onClick={() => copy(loginText(result))}>{copied ? 'コピーしました' : '文面をコピー'}</button>
            <button style={{ ...btn('#faf7f3', '#2a2220'), border: `1px solid ${LINE}` }} onClick={() => setResult(null)}>閉じる</button>
          </div>
        </div>
      )}

      {loading && <p style={{ color: '#8a7f7a' }}>読み込み中…</p>}
      {!loading && list.length === 0 && <p style={{ color: '#8a7f7a' }}>{STATUS_LABEL[filter]}の申込はありません。</p>}

      {list.map((r) => (
        <div key={r.id} style={box}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 17, fontWeight: 800 }}>{r.name}</span>
              <span style={{ fontSize: 13, color: '#8a7f7a', marginLeft: 8 }}>{r.name_kana}</span>
            </div>
            <div style={{ fontSize: 12, color: '#8a7f7a' }}>申込 {fmtDate(r.created_at)}</div>
          </div>

          <Row k="カテゴリー" v={r.category} />
          <Row k="生年月日" v={`${r.birth_date}（${ageOf(r.birth_date)}歳）`} />
          <Row k="ニックネーム" v={r.nickname} />
          <Row k="携帯番号" v={r.phone} tel />
          <Row k="メール" v={r.email} />
          <Row k="住所" v={r.address} />
          <Row k="勤務先/学校" v={r.workplace} />
          <Row k="出身地" v={r.hometown} />
          <Row k="緊急連絡先" v={`${r.emergency_name}${r.emergency_relation ? `（${r.emergency_relation}）` : ''}`} />
          <Row k="緊急連絡先 TEL" v={r.emergency_phone} tel />
          <Row k="ポジション" v={[r.position1, r.position2].filter(Boolean).join(' / ')} />
          <Row k="ユニサイズ" v={r.uniform_size} />
          <Row k="入部時期" v={r.join_period} />
          <Row k="帰任予定" v={r.return_period} />
          <Row k="保護者" v={r.guardian_name} />
          <Row k="同意（署名）" v={`${r.consent_name}　${fmtDate(r.consent_at)}`} />
          {r.status === 'approved' && <Row k="承認" v={`部員番号 ${r.member_no ?? '-'}　${fmtDate(r.approved_at)}`} />}
          {r.status === 'rejected' && <Row k="却下理由" v={r.reject_reason || '（未入力）'} />}

          {r.status === 'pending' && (
            <div style={{ marginTop: 10 }}>
              {openId !== r.id && rejectId !== r.id && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={btn(GOLD)} onClick={() => openApprove(r)}>承認する</button>
                  <button style={{ ...btn('#faf7f3', '#c0392b'), border: `1px solid ${LINE}` }} onClick={() => { setOpenId(null); setRejectId(r.id) }}>却下</button>
                </div>
              )}

              {openId === r.id && (
                <div style={{ background: '#faf7f3', border: `1px solid ${GOLD}`, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 14, marginBottom: 8, lineHeight: 1.7 }}>
                    ログインアカウントとメンバー登録を作成します。仮パスワードは自動で作られ、承認後に一度だけ表示されます。
                  </div>
                  <label style={{ fontSize: 13, color: '#5a4f4a' }}>部員番号（変更できます）</label>
                  <div style={{ display: 'flex', gap: 8, margin: '4px 0 10px', alignItems: 'center' }}>
                    <input style={{ ...input, width: 110 }} type="number" min="1" value={memberNo} onChange={(e) => setMemberNo(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ ...btn(GOLD), opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={() => approve(r)}>{busy ? '処理中…' : '承認してアカウント作成'}</button>
                    <button style={{ ...btn('#faf7f3', '#2a2220'), border: `1px solid ${LINE}` }} onClick={() => setOpenId(null)}>やめる</button>
                  </div>
                </div>
              )}

              {rejectId === r.id && (
                <div style={{ background: '#faf7f3', border: `1px solid ${LINE}`, borderRadius: 8, padding: 12 }}>
                  <label style={{ fontSize: 13, color: '#5a4f4a' }}>却下の理由（任意・内部メモ）</label>
                  <input style={{ ...input, width: '100%', margin: '4px 0 10px' }} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="例）重複申込 / 連絡がつかない" />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ ...btn('#c0392b', '#fff'), opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={() => reject(r)}>却下する</button>
                    <button style={{ ...btn('#faf7f3', '#2a2220'), border: `1px solid ${LINE}` }} onClick={() => setRejectId(null)}>やめる</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {r.status === 'rejected' && (
            <div style={{ marginTop: 10 }}>
              <button style={{ ...btn('#faf7f3', '#c0392b'), border: `1px solid ${LINE}` }} onClick={() => remove(r)}>データを削除</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}