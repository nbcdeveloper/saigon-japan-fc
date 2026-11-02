import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// 備品管理（U-40／O-40別）。編集権限は profiles.equipment_editor_u40 / equipment_editor_o40 を持つ人だけ。
// 閲覧は両チーム分を表示し、編集・追加・削除は権限のあるチームだけに出す。

const btn = (bg, color, extra = {}) => ({
  padding: '7px 14px', background: bg, color, border: 'none',
  borderRadius: '6px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer', ...extra
})

const inputStyle = {
  width: '100%', padding: '8px 10px', border: '1.5px solid #e0dbd5',
  borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'inherit'
}

const labelStyle = {
  fontSize: '11.5px', fontWeight: '600', color: '#8a7f7a', display: 'block', marginBottom: '4px'
}

// UTCではなくローカル時間（ベトナム時間）基準で「今日」の日付文字列を作る
const todayLocalStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const TEAMS = [
  { key: 'u40', label: 'U-40', color: '#7b5ea7', bg: '#ede8f7' },
  { key: 'o40', label: 'O-40', color: '#2a5fa5', bg: '#dceeff' },
]

const fmtDate = (d) => (d ? String(d).replace(/-/g, '/') : '')

// 管理者は複数人を「、」区切りの1つの文字列で保存する（例：山田貴寛、池端亮治）
const splitManagers = (v) => (v ? String(v).split(/[、,，]/).map(x => x.trim()).filter(Boolean) : [])

export default function AdminEquipment({ canU40, canO40, members = [] }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [modal, setModal] = useState(null) // { team, item } item=nullなら新規追加
  const [form, setForm] = useState({ updated_on: '', name: '', quantity: '', managers: [], memo: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchItems() }, [])

  const fetchItems = async () => {
    const { data, error } = await supabase.from('equipment_items').select('*').order('sort_order').order('created_at')
    if (error) {
      setLoadError(error.message)
    } else {
      setLoadError('')
      setItems(data || [])
    }
    setLoading(false)
  }

  const openAdd = (team) => {
    setForm({ updated_on: todayLocalStr(), name: '', quantity: '', managers: [], memo: '' })
    setModal({ team, item: null })
  }

  // 編集して保存する＝内容を更新する、ということで更新日は今日の日付を初期値にする（必要なら変更可）
  const openEdit = (team, item) => {
    setForm({
      updated_on: todayLocalStr(),
      name: item.name || '',
      // 数量は数字のみ。以前の文字入りデータ（例：3着）は先頭の数字だけ引き継ぐ
      quantity: /^\d+/.test(String(item.quantity ?? '')) ? String(parseInt(String(item.quantity), 10)) : '',
      managers: splitManagers(item.manager),
      memo: item.memo || '',
    })
    setModal({ team, item })
  }

  const closeModal = () => { setModal(null) }

  // 管理者の選択肢：そのチームの所属メンバー（在籍中。兼務メンバーは両チームに含む）。名前順
  const managerOptions = (team) => members
    .filter(m => m.status === 'active' && (m.team === team || m.dual_team))
    .map(m => m.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'ja'))

  const handleSave = async () => {
    if (!modal || saving) return
    const name = form.name.trim()
    if (!name) { window.alert('備品名を入力してください'); return }
    const payload = {
      name,
      quantity: form.quantity === '' || isNaN(parseInt(form.quantity, 10)) ? null : Math.max(0, parseInt(form.quantity, 10)),
      manager: form.managers.length > 0 ? form.managers.join('、') : null,
      memo: form.memo.trim() || null,
      updated_on: form.updated_on || todayLocalStr(),
    }
    setSaving(true)
    let res
    if (modal.item) {
      res = await supabase.from('equipment_items').update(payload).eq('id', modal.item.id).select()
    } else {
      const teamItems = items.filter(i => i.team === modal.team)
      const maxOrder = teamItems.length > 0 ? Math.max(...teamItems.map(i => i.sort_order || 0)) : 0
      res = await supabase.from('equipment_items').insert({ ...payload, team: modal.team, sort_order: maxOrder + 1 }).select()
    }
    setSaving(false)
    if (res.error) { window.alert('保存に失敗しました：' + res.error.message); return }
    // 権限がない場合、エラーにならず0件更新で終わることがあるため、結果の件数でも確認する
    if (!res.data || res.data.length === 0) {
      window.alert('保存できませんでした。このチームの備品を編集する権限があるか確認してください。')
      return
    }
    closeModal()
    await fetchItems()
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`「${item.name}」を削除しますか？`)) return
    const { data, error } = await supabase.from('equipment_items').delete().eq('id', item.id).select()
    if (error) { window.alert('削除に失敗しました：' + error.message); return }
    if (!data || data.length === 0) {
      window.alert('削除できませんでした。このチームの備品を編集する権限があるか確認してください。')
      return
    }
    await fetchItems()
  }

  if (loading) return <div style={{ color: '#8a7f7a', fontSize: '13px' }}>読み込み中...</div>

  if (loadError) {
    return (
      <div style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', color: '#c0392b', fontSize: '13px', lineHeight: 1.7 }}>
        備品データを読み込めませんでした。<br />
        <span style={{ color: '#8a7f7a', fontSize: '12px' }}>{loadError}</span><br />
        <span style={{ color: '#8a7f7a', fontSize: '12px' }}>（備品管理用のデータベースの準備〔SQL〕がまだ実行されていない可能性があります）</span>
      </div>
    )
  }

  return (
    <div>
      {TEAMS.map(t => {
        // 更新日が新しいものを上に。同じ日付の中は登録順
        const list = items.filter(i => i.team === t.key).sort((a, b) =>
          (b.updated_on || '').localeCompare(a.updated_on || '') || ((a.sort_order || 0) - (b.sort_order || 0)))
        const canEdit = t.key === 'u40' ? canU40 : canO40
        const latest = list.reduce((a, i) => (i.updated_on && i.updated_on > a ? i.updated_on : a), '')
        const headers = ['更新日', '備品名', '数量', '管理者', 'メモ', ...(canEdit ? ['操作'] : [])]
        return (
          <div key={t.key} style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: t.bg, color: t.color, fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '4px' }}>{t.label}</span>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#2a2220' }}>備品一覧</span>
                <span style={{ fontSize: '11.5px', color: '#8a7f7a' }}>
                  {list.length}件{latest ? `／最終更新 ${fmtDate(latest)}` : ''}{!canEdit ? '／閲覧のみ' : ''}
                </span>
              </div>
              {canEdit && <button style={btn('#e8c84a', '#2a2220')} onClick={() => openAdd(t.key)}>＋備品を追加</button>}
            </div>

            {list.length === 0 ? (
              <div style={{ color: '#8a7f7a', fontSize: '12.5px', padding: '14px 0' }}>まだ備品が登録されていません</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      {headers.map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 10px', background: '#f8f5f0', color: '#8a7f7a', fontSize: '11.5px', fontWeight: '700', whiteSpace: 'nowrap', borderBottom: '1.5px solid #e0dbd5' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f0ebe5', verticalAlign: 'top' }}>
                        <td style={{ padding: '9px 10px', whiteSpace: 'nowrap', color: '#8a7f7a' }}>{fmtDate(item.updated_on)}</td>
                        <td style={{ padding: '9px 10px', fontWeight: '600', color: '#2a2220', wordBreak: 'break-word' }}>{item.name}</td>
                        <td style={{ padding: '9px 10px', wordBreak: 'break-word' }}>{item.quantity ?? '-'}</td>
                        <td style={{ padding: '9px 10px', wordBreak: 'break-word' }}>{item.manager || '-'}</td>
                        <td style={{ padding: '9px 10px', color: '#555', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}>{item.memo || ''}</td>
                        {canEdit && (
                          <td style={{ padding: '9px 10px', whiteSpace: 'nowrap' }}>
                            <button style={btn('#2a5fa5', 'white', { padding: '3px 9px', fontSize: '11px', marginRight: '6px' })} onClick={() => openEdit(t.key, item)}>編集</button>
                            <button style={btn('#e74c3c', 'white', { padding: '3px 9px', fontSize: '11px' })} onClick={() => handleDelete(item)}>削除</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={closeModal}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', width: '460px', maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#2a2220', marginBottom: '14px' }}>
              {modal.team === 'u40' ? 'U-40' : 'O-40'}の備品を{modal.item ? '編集' : '追加'}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>更新日</label>
              <input type="date" style={inputStyle} value={form.updated_on} onChange={e => setForm({ ...form, updated_on: e.target.value })} />
              {modal.item && <div style={{ fontSize: '11px', color: '#8a7f7a', marginTop: '4px' }}>編集して保存すると、更新日は今日の日付になります（必要なら変更できます）</div>}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>備品名 *</label>
              <input style={inputStyle} value={form.name} autoFocus onChange={e => setForm({ ...form, name: e.target.value })} placeholder="例：ビブス" />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>数量（数字のみ）</label>
              <input type="number" inputMode="numeric" min="0" step="1" style={inputStyle} value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="例：10" />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>管理者（複数選択できます）</label>
              {(() => {
                const options = managerOptions(modal.team)
                // 以前に手入力された名前など、メンバー名と一致しない値も、外せるように残して表示する
                const legacy = form.managers.filter(n => !options.includes(n))
                const all = [...legacy, ...options]
                const toggle = (n) => setForm({ ...form, managers: form.managers.includes(n) ? form.managers.filter(x => x !== n) : [...form.managers, n] })
                return (
                  <>
                    <div style={{ border: '1.5px solid #e0dbd5', borderRadius: '6px', padding: '6px 10px', maxHeight: '170px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '2px 10px' }}>
                      {all.length === 0 && <div style={{ color: '#8a7f7a', fontSize: '12px', padding: '4px 0' }}>選べるメンバーがいません</div>}
                      {all.map(n => (
                        <label key={n} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '4px 0', cursor: 'pointer' }}>
                          <input type="checkbox" checked={form.managers.includes(n)} onChange={() => toggle(n)} />
                          <span>{n}{legacy.includes(n) ? '（現在の値）' : ''}</span>
                        </label>
                      ))}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8a7f7a', marginTop: '4px' }}>
                      選択中：{form.managers.length > 0 ? form.managers.join('、') : 'なし'}
                    </div>
                  </>
                )
              })()}
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>メモ</label>
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} placeholder="例：持ち回り／貸出中の方など" />
            </div>
            <div style={{ display: 'flex', gap: '9px', justifyContent: 'flex-end' }}>
              <button style={btn('transparent', '#2a2220', { border: '1.5px solid #ddd' })} onClick={closeModal}>キャンセル</button>
              <button disabled={saving} style={btn('#e8c84a', '#2a2220', { fontWeight: '700' })} onClick={handleSave}>{saving ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
