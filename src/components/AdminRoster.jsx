import { useState, useEffect, useMemo, Fragment } from 'react'
import { supabase } from '../supabase'

// 管理者画面「部員情報」タブ（代表のみ表示。Admin.jsx 側で isTreasurerAdmin のときだけタブを出す）
// ・profiles（部員）と、本人がマイページで登録した連絡先（member_contacts）・承認済みの入部申込（entry_applications）を
//   profile_id でつなげて表示
// ・見た目はメンバータブと同じ（白カード＋表、13px）

const btn = (bg, color, extra = {}) => ({
  padding: '7px 14px', background: bg, color, border: 'none',
  borderRadius: '6px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer', ...extra
})
const inputStyle = {
  width: '100%', padding: '8px 10px', border: '1.5px solid #e0dbd5',
  borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
}
const card = { background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }
const th = { background: '#2a2220', color: '#e8c84a', padding: '9px 12px', textAlign: 'left', fontSize: '12px', whiteSpace: 'nowrap' }
const td = { padding: '9px 12px', whiteSpace: 'nowrap', verticalAlign: 'top' }
const muted = '#8a7f7a'

const teamBadge = (team) => team === 'u40'
  ? <span style={{ background: '#ede8f7', color: '#7b5ea7', fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '3px' }}>U-40</span>
  : <span style={{ background: '#dceeff', color: '#2a5fa5', fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '3px' }}>O-40</span>

const statusInfo = (status) => {
  if (status === 'active') return { label: '在籍', bg: '#d4f4e0', color: '#1a7a40' }
  if (status === 'left') return { label: '退会', bg: '#f0ebe5', color: '#8a7f7a' }
  return { label: '休止中', bg: '#fff3cd', color: '#856404' }
}

const telHref = (v) => `tel:${String(v || '').replace(/[^0-9+]/g, '')}`
const Tel = ({ v }) => v
  ? <a href={telHref(v)} style={{ color: '#2a5fa5', fontWeight: '600', textDecoration: 'none' }}>{v}</a>
  : <span style={{ color: '#c8bfb8' }}>－</span>

const ageOf = (y, m, d) => {
  if (!y) return null
  const t = new Date()
  let a = t.getFullYear() - y
  if (m && (t.getMonth() + 1 < m || (t.getMonth() + 1 === m && d && t.getDate() < d))) a--
  return a
}

const csvCell = (v) => {
  const s = v == null ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export default function AdminRoster({ members }) {
  const [entries, setEntries] = useState([])
  const [contacts, setContacts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState('all')
  const [showLeft, setShowLeft] = useState(false)
  const [onlyMissing, setOnlyMissing] = useState(false)
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    let alive = true
    Promise.all([
      supabase.from('entry_applications').select('*').eq('status', 'approved').not('profile_id', 'is', null),
      supabase.from('member_contacts').select('*'),
    ]).then(([ea, mc]) => {
      if (!alive) return
      if (ea.error) setError('入部申込データの読み込みに失敗しました：' + ea.error.message)
      else setEntries(ea.data || [])
      if (!mc.error) setContacts(mc.data || [])
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  // profile_id ごとに「最新の承認済み申込」＋「マイページで本人が登録した連絡先（こちらを優先）」
  const infoByProfile = useMemo(() => {
    const map = {}
    for (const e of entries) {
      const cur = map[e.profile_id]
      if (!cur || new Date(e.approved_at || e.created_at) > new Date(cur.approved_at || cur.created_at)) map[e.profile_id] = e
    }
    for (const c of contacts) {
      const merged = { ...(map[c.profile_id] || {}), fromMyPage: true, contactUpdatedAt: c.updated_at }
      for (const k of ['phone', 'emergency_name', 'emergency_relation', 'emergency_phone']) if (c[k]) merged[k] = c[k]
      map[c.profile_id] = merged
    }
    return map
  }, [entries, contacts])

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase()
    return (members || [])
      .map((m) => ({ m, e: infoByProfile[m.id] || null }))
      .filter(({ m }) => showLeft || m.status !== 'left')
      .filter(({ m }) => team === 'all' || m.team === team)
      .filter(({ e }) => !onlyMissing || !e?.emergency_phone)
      .filter(({ m, e }) => !kw || [m.name, m.name_kana, m.name_romaji, e?.nickname, e?.phone, e?.emergency_name, e?.emergency_phone, m.member_no]
        .some((v) => v != null && String(v).toLowerCase().includes(kw)))
      .sort((a, b) => (a.m.member_no ?? 99999) - (b.m.member_no ?? 99999) || String(a.m.name_kana || a.m.name).localeCompare(String(b.m.name_kana || b.m.name), 'ja'))
  }, [members, infoByProfile, team, showLeft, onlyMissing, q])

  const activeCount = (members || []).filter((m) => m.status !== 'left').length
  const missingCount = (members || []).filter((m) => m.status !== 'left' && !infoByProfile[m.id]?.emergency_phone).length

  const downloadCsv = () => {
    const head = ['部員番号', '氏名', 'フリガナ', 'チーム', '在籍', '携帯番号', 'メール', '緊急連絡先 氏名', '続柄', '緊急連絡先 TEL', '生年月日', '住所', '勤務先/学校', '出身地', 'ポジション', '帰任予定']
    const lines = rows.map(({ m, e }) => [
      m.member_no, m.name, m.name_kana || e?.name_kana, m.team === 'u40' ? 'U-40' : 'O-40', statusInfo(m.status).label,
      e?.phone, e?.email, e?.emergency_name, e?.emergency_relation, e?.emergency_phone,
      e?.birth_date || (m.birth_year ? [m.birth_year, m.birth_month, m.birth_day].filter(Boolean).join('-') : ''),
      e?.address, e?.workplace, e?.hometown, [m.position1, m.position2].filter(Boolean).join('/'), e?.return_period,
    ].map(csvCell).join(','))
    const csv = '﻿' + [head.join(','), ...lines].join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    const d = new Date()
    a.href = url
    a.download = `SJFC部員情報_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const chip = (active) => btn(active ? '#2a2220' : 'transparent', active ? '#e8c84a' : '#2a2220', active ? {} : { border: '1.5px solid #ddd' })

  return (
    <div>
      <p style={{ fontSize: '12px', color: muted, lineHeight: 1.7, margin: '0 0 12px' }}>
        代表だけが見られる部員の連絡先一覧です。電話番号をタップするとそのまま発信できます。
        連絡先は、本人がマイページで登録した内容（なければ入部フォームの申込内容）を表示しています。
        CSVは必要なときだけ出力し、共有チャットなどには貼らないでください。
      </p>

      {!loading && missingCount > 0 && (
        <div style={{ background: '#fff3cd', color: '#856404', borderRadius: '6px', padding: '9px 12px', fontSize: '12.5px', marginBottom: '12px', lineHeight: 1.7 }}>
          ⚠️ 緊急連絡先が未登録の部員が <b>{missingCount}名</b> います。本人にマイページの「🚑 連絡先・緊急連絡先」から登録をお願いしてください。
          ※すでにログインできる部員には入部フォームを使わせないでください（承認するとパスワードが再発行されます）。
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        {[['all', 'すべて'], ['u40', 'U-40'], ['o40', 'O-40']].map(([v, l]) => (
          <button key={v} style={chip(team === v)} onClick={() => setTeam(v)}>{l}</button>
        ))}
        <button style={chip(onlyMissing)} onClick={() => setOnlyMissing(!onlyMissing)}>未登録のみ</button>
        <label style={{ fontSize: '12.5px', color: '#5a4f4a', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input type="checkbox" checked={showLeft} onChange={(e) => setShowLeft(e.target.checked)} /> 退会者も表示
        </label>
        <div style={{ flex: 1 }} />
        <button style={btn('#2a2220', '#e8c84a')} onClick={downloadCsv} disabled={!rows.length}>CSV出力</button>
      </div>
      <input style={{ ...inputStyle, marginBottom: '12px' }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="名前・電話番号・部員番号で検索" />

      {error && <div style={{ background: '#fde8e6', color: '#c0392b', borderRadius: '6px', padding: '9px 12px', fontSize: '12.5px', marginBottom: '12px' }}>{error}</div>}

      <div style={{ fontSize: '13px', color: muted, marginBottom: '8px' }}>
        {loading ? '読み込み中...' : `${rows.length}名を表示（在籍・休止 ${activeCount}名）`}
      </div>

      {!loading && (
        <div style={card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '720px' }}>
              <thead>
                <tr>{['No.', '名前', 'チーム', 'ステータス', '本人 TEL', '緊急連絡先', '緊急 TEL', ''].map((h, i) => (
                  <th key={i} style={{ ...th, ...(i === 1 ? { position: 'sticky', left: 0, zIndex: 3 } : {}) }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={8} style={{ ...td, color: muted, textAlign: 'center' }}>該当する部員はいません</td></tr>
                )}
                {rows.map(({ m, e }) => {
                  const open = openId === m.id
                  const st = statusInfo(m.status)
                  const age = e?.birth_date ? ageOf(...e.birth_date.split('-').map(Number)) : ageOf(m.birth_year, m.birth_month, m.birth_day)
                  const details = [
                    ['ニックネーム', e?.nickname],
                    ['年齢', age != null ? `${age}歳${e?.birth_date ? `（${e.birth_date}）` : ''}` : null],
                    ['メール', e?.email],
                    ['住所', e?.address],
                    ['勤務先/学校', e?.workplace],
                    ['出身地', e?.hometown],
                    ['ポジション', [m.position1, m.position2].filter(Boolean).join(' / ')],
                    ['入部', m.joined_at ? m.joined_at.slice(0, 7).replace('-', '/') : e?.join_period],
                    ['帰任予定', e?.return_period],
                    ['保護者', e?.guardian_name],
                    ['連絡先の更新', e?.fromMyPage ? `マイページで本人が登録（${new Date(e.contactUpdatedAt).toLocaleDateString('ja-JP')}）` : null],
                  ].filter(([, v]) => v)
                  return (
                    <Fragment key={m.id}>
                      <tr style={{ borderBottom: open ? 'none' : '1px solid #f0ebe5' }}>
                        <td style={{ ...td, color: muted }}>{m.member_no ?? '－'}</td>
                        <td style={{ ...td, fontWeight: '500', position: 'sticky', left: 0, zIndex: 1, background: 'white', boxShadow: '2px 0 4px rgba(0,0,0,0.06)' }}>{m.name}</td>
                        <td style={td}>{teamBadge(m.team)}</td>
                        <td style={td}>
                          <span style={{ background: st.bg, color: st.color, fontSize: '11px', fontWeight: '600', padding: '2px 7px', borderRadius: '4px' }}>{st.label}</span>
                        </td>
                        <td style={td}><Tel v={e?.phone} /></td>
                        <td style={td}>
                          {e?.emergency_name
                            ? <>{e.emergency_name}{e.emergency_relation && <span style={{ color: muted }}>（{e.emergency_relation}）</span>}</>
                            : <span style={{ background: '#fde8e6', color: '#c0392b', fontSize: '11px', fontWeight: '600', padding: '2px 7px', borderRadius: '4px' }}>未登録</span>}
                        </td>
                        <td style={td}><Tel v={e?.emergency_phone} /></td>
                        <td style={td}>
                          <button style={btn('transparent', '#2a2220', { border: '1.5px solid #ddd', padding: '4px 9px', fontSize: '11.5px' })} onClick={() => setOpenId(open ? null : m.id)}>
                            {open ? '閉じる' : '詳細'}
                          </button>
                        </td>
                      </tr>
                      {open && (
                        <tr style={{ borderBottom: '1px solid #f0ebe5' }}>
                          <td colSpan={8} style={{ padding: '4px 12px 12px', background: '#faf7f3' }}>
                            {details.length === 0
                              ? <div style={{ fontSize: '12px', color: muted, paddingTop: '6px' }}>登録された情報がありません。本人にマイページの「🚑 連絡先・緊急連絡先」から登録してもらってください。</div>
                              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '2px 18px', paddingTop: '6px' }}>
                                  {details.map(([k, v]) => (
                                    <div key={k} style={{ fontSize: '12.5px', lineHeight: 1.8, whiteSpace: 'normal' }}>
                                      <span style={{ color: muted, marginRight: '8px' }}>{k}</span>{v}
                                    </div>
                                  ))}
                                </div>}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
