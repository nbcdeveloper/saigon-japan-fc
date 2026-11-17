import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabase'

// 管理者画面「部員リスト」タブ（管理者だけが見る名簿）
// ・profiles（部員）と、承認済みの entry_applications（入部申込）を profile_id でつなげて表示
// ・緊急連絡先・電話番号は entry_applications にだけ保存されている（RLSで管理者のみ閲覧可）
// ・入部フォーム導入前からいる部員は申込データがないため「緊急連絡先 未登録」と表示する

const GOLD = '#e8c84a'
const LINE = '#e0dbd5'
const RED = '#c0392b'

const box = { background: 'white', border: `1px solid ${LINE}`, borderRadius: 12, padding: '12px 14px', marginBottom: 10 }
const btn = (bg, fg = '#2a2220') => ({ background: bg, color: fg, border: `1px solid ${bg === 'white' || bg === '#faf7f3' ? LINE : bg}`, borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' })
const input = { background: '#faf7f3', color: '#2a2220', border: `1px solid ${LINE}`, borderRadius: 8, padding: '8px 10px', fontSize: 15, boxSizing: 'border-box' }

const TEAM_LABEL = { u40: 'U-40', o40: 'O-40' }
const STATUS_LABEL = { active: '在籍', inactive: '休止中', left: '退会' }

const telHref = (v) => `tel:${String(v || '').replace(/[^0-9+]/g, '')}`

function Tel({ v }) {
  if (!v) return <span style={{ color: '#b0a89f' }}>-</span>
  return <a href={telHref(v)} style={{ color: '#8a6d00', fontWeight: 700, textDecoration: 'none' }}>📞 {v}</a>
}

function Row({ k, v }) {
  if (!v) return null
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 13.5, lineHeight: 1.7 }}>
      <div style={{ width: 96, flexShrink: 0, color: '#8a7f7a' }}>{k}</div>
      <div style={{ flex: 1, wordBreak: 'break-all' }}>{v}</div>
    </div>
  )
}

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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState('all')
  const [showLeft, setShowLeft] = useState(false)
  const [onlyMissing, setOnlyMissing] = useState(false)
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(null)

  const [contacts, setContacts] = useState([])

  useEffect(() => {
    let alive = true
    Promise.all([
      supabase.from('entry_applications').select('*').eq('status', 'approved').not('profile_id', 'is', null),
      supabase.from('member_contacts').select('*'),
    ]).then(([ea, mc]) => {
      if (!alive) return
      if (ea.error) setError('入部申込データの読み込みに失敗しました：' + ea.error.message)
      else setEntries(ea.data || [])
      if (!mc.error) setContacts(mc.data || []) // テーブル未作成のときは申込データだけで表示
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  // profile_id ごとに「最新の承認済み申込」＋「マイページで本人が登録した連絡先（こちらを優先）」
  const entryByProfile = useMemo(() => {
    const map = {}
    for (const e of entries) {
      const cur = map[e.profile_id]
      if (!cur || new Date(e.approved_at || e.created_at) > new Date(cur.approved_at || cur.created_at)) map[e.profile_id] = e
    }
    for (const c of contacts) {
      const base = map[c.profile_id] || {}
      const merged = { ...base, fromMyPage: true, contactUpdatedAt: c.updated_at }
      for (const k of ['phone', 'emergency_name', 'emergency_relation', 'emergency_phone']) if (c[k]) merged[k] = c[k]
      map[c.profile_id] = merged
    }
    return map
  }, [entries, contacts])

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase()
    return (members || [])
      .map((m) => ({ m, e: entryByProfile[m.id] || null }))
      .filter(({ m }) => showLeft || m.status !== 'left')
      .filter(({ m }) => team === 'all' || m.team === team)
      .filter(({ e }) => !onlyMissing || !e?.emergency_phone)
      .filter(({ m, e }) => {
        if (!kw) return true
        return [m.name, m.name_kana, m.nickname, e?.nickname, e?.phone, e?.emergency_name, e?.emergency_phone, m.member_no]
          .some((v) => v != null && String(v).toLowerCase().includes(kw))
      })
      .sort((a, b) => (a.m.member_no ?? 99999) - (b.m.member_no ?? 99999) || String(a.m.name_kana || a.m.name).localeCompare(String(b.m.name_kana || b.m.name), 'ja'))
  }, [members, entryByProfile, team, showLeft, onlyMissing, q])

  const activeCount = (members || []).filter((m) => m.status !== 'left').length
  const missingCount = (members || []).filter((m) => m.status !== 'left' && !entryByProfile[m.id]?.emergency_phone).length

  const downloadCsv = () => {
    const head = ['部員番号', '氏名', 'フリガナ', 'チーム', '在籍', '携帯番号', 'メール', '緊急連絡先 氏名', '続柄', '緊急連絡先 TEL', '生年月日', '住所', '勤務先/学校', '出身地', 'ポジション', '帰任予定']
    const lines = rows.map(({ m, e }) => [
      m.member_no, m.name, m.name_kana || e?.name_kana, TEAM_LABEL[m.team] || m.team, STATUS_LABEL[m.status] || m.status,
      e?.phone, e?.email || m.email, e?.emergency_name, e?.emergency_relation, e?.emergency_phone,
      e?.birth_date || (m.birth_year ? [m.birth_year, m.birth_month, m.birth_day].filter(Boolean).join('-') : ''),
      e?.address, e?.workplace, e?.hometown, [m.position1, m.position2].filter(Boolean).join('/'), e?.return_period,
    ].map(csvCell).join(','))
    const csv = '﻿' + [head.join(','), ...lines].join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    const d = new Date()
    a.href = url
    a.download = `SJFC部員リスト_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const chip = (active) => ({ ...btn(active ? '#2a2220' : 'white', active ? GOLD : '#2a2220') })

  return (
    <div>
      <p style={{ fontSize: 13, color: '#8a7f7a', lineHeight: 1.7, margin: '0 0 12px' }}>
        管理者専用の部員名簿です。電話番号をタップするとそのまま発信できます。
        連絡先は、本人がマイページで登録した内容（なければ入部フォームの申込内容）を表示しています。
        個人情報のため、CSVは必要なときだけ出力し、共有チャットなどには貼らないでください。
      </p>

      {missingCount > 0 && !loading && (
        <div style={{ background: '#fff6e0', border: `1px solid ${GOLD}`, borderRadius: 8, padding: '10px 12px', fontSize: 13.5, marginBottom: 12, lineHeight: 1.7 }}>
          ⚠️ 緊急連絡先が未登録の部員が <b>{missingCount}名</b> います（入部フォーム導入前からの部員など）。
          本人にマイページの「🚑 連絡先・緊急連絡先」から登録をお願いしてください。
          ※すでにログインできる部員には入部フォームを使わせないでください（承認するとパスワードが再発行されます）。
          <button style={{ ...btn('white'), marginLeft: 8, padding: '3px 10px', fontSize: 12 }} onClick={() => setOnlyMissing(!onlyMissing)}>
            {onlyMissing ? 'すべて表示' : '未登録のみ表示'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['all', 'すべて'], ['u40', 'U-40'], ['o40', 'O-40']].map(([v, l]) => (
          <button key={v} style={chip(team === v)} onClick={() => setTeam(v)}>{l}</button>
        ))}
        <label style={{ fontSize: 13, color: '#5a4f4a', display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={showLeft} onChange={(e) => setShowLeft(e.target.checked)} /> 退会者も表示
        </label>
        <div style={{ flex: 1 }} />
        <button style={btn(GOLD)} onClick={downloadCsv} disabled={!rows.length}>CSV出力</button>
      </div>
      <input style={{ ...input, width: '100%', marginBottom: 12 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="名前・フリガナ・電話番号・部員番号で検索" />

      {error && <div style={{ background: '#fde8e6', border: '1px solid #e8a59d', color: RED, borderRadius: 8, padding: '10px 12px', fontSize: 14, marginBottom: 12 }}>{error}</div>}
      {loading && <p style={{ color: '#8a7f7a' }}>読み込み中…</p>}

      {!loading && (
        <div style={{ fontSize: 12, color: '#8a7f7a', marginBottom: 8 }}>{rows.length}名を表示（在籍・休止 {activeCount}名）</div>
      )}
      {!loading && rows.length === 0 && <p style={{ color: '#8a7f7a' }}>該当する部員はいません。</p>}

      {!loading && rows.map(({ m, e }) => {
        const open = openId === m.id
        const age = e?.birth_date ? ageOf(...e.birth_date.split('-').map(Number)) : ageOf(m.birth_year, m.birth_month, m.birth_day)
        return (
          <div key={m.id} style={{ ...box, opacity: m.status === 'left' ? 0.6 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', cursor: 'pointer' }} onClick={() => setOpenId(open ? null : m.id)}>
              <div style={{ minWidth: 0 }}>
                {m.member_no != null && <span style={{ fontSize: 12, color: '#8a7f7a', marginRight: 6 }}>#{m.member_no}</span>}
                <span style={{ fontSize: 16, fontWeight: 800 }}>{m.name}</span>
                {(m.name_kana || e?.name_kana) && <span style={{ fontSize: 12, color: '#8a7f7a', marginLeft: 6 }}>{m.name_kana || e?.name_kana}</span>}
                <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 8, padding: '1px 6px', borderRadius: 4, background: m.team === 'u40' ? '#ece4f6' : '#e2ebf6', color: m.team === 'u40' ? '#7b5ea7' : '#2a5fa5' }}>{TEAM_LABEL[m.team] || m.team}</span>
                {m.status !== 'active' && <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 4, padding: '1px 6px', borderRadius: 4, background: '#fff3cd', color: '#856404' }}>{STATUS_LABEL[m.status] || m.status}</span>}
              </div>
              <div style={{ fontSize: 12, color: '#8a7f7a' }}>{open ? '▲ 閉じる' : '▼ 詳細'}</div>
            </div>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8, fontSize: 13.5 }}>
              <div><span style={{ color: '#8a7f7a', marginRight: 6 }}>本人</span><Tel v={e?.phone} /></div>
              <div style={{ background: e?.emergency_phone ? '#fff6e0' : '#fde8e6', borderRadius: 6, padding: '2px 8px' }}>
                <span style={{ color: e?.emergency_phone ? '#8a6d00' : RED, fontWeight: 700, marginRight: 6 }}>🚑 緊急</span>
                {e?.emergency_phone
                  ? <>{e.emergency_name}{e.emergency_relation ? `（${e.emergency_relation}）` : ''}{' '}<Tel v={e.emergency_phone} /></>
                  : <span style={{ color: RED }}>未登録</span>}
              </div>
            </div>

            {open && (
              <div style={{ borderTop: `1px dashed ${LINE}`, marginTop: 10, paddingTop: 8 }}>
                <Row k="ニックネーム" v={e?.nickname || m.nickname} />
                <Row k="年齢" v={age != null ? `${age}歳${e?.birth_date ? `（${e.birth_date}）` : ''}` : null} />
                <Row k="メール" v={e?.email || m.email} />
                <Row k="住所" v={e?.address} />
                <Row k="勤務先/学校" v={e?.workplace} />
                <Row k="出身地" v={e?.hometown} />
                <Row k="ポジション" v={[m.position1, m.position2].filter(Boolean).join(' / ')} />
                <Row k="入部" v={m.joined_at || e?.join_period} />
                <Row k="帰任予定" v={e?.return_period} />
                <Row k="保護者" v={e?.guardian_name} />
                {e?.fromMyPage && <Row k="連絡先の更新" v={`マイページで本人が登録（${new Date(e.contactUpdatedAt).toLocaleDateString('ja-JP')}）`} />}
                {!e && <div style={{ fontSize: 12.5, color: '#8a7f7a', marginTop: 4 }}>連絡先の登録がありません。本人にマイページの「🚑 連絡先・緊急連絡先」から登録してもらってください。</div>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
