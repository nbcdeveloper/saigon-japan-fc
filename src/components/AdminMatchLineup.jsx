import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// ユニフォーム画像。public/kit-uniform.png に配置してください（芦田さんが元々アップロードされた画像そのまま・加工なし）
const KIT_IMG = '/kit-uniform.png'

// どのフォーメーションも「FW行→MF行→MF行→DF行」の4行構成に統一。
// 行数を揃えることで、フォーメーションを切り替えてもピッチの縦サイズが変わらないようにしている。
const FORMATIONS = {
  '4-2-3-1': [{ label: 'FW', idx: [10] }, { label: 'MF', idx: [7, 8, 9] }, { label: 'MF', idx: [5, 6] }, { label: 'DF', idx: [1, 2, 3, 4] }],
  '4-2-2-2': [{ label: 'FW', idx: [9, 10] }, { label: 'MF', idx: [7, 8] }, { label: 'MF', idx: [5, 6] }, { label: 'DF', idx: [1, 2, 3, 4] }],
  '3-2-3-2': [{ label: 'FW', idx: [9, 10] }, { label: 'MF', idx: [4, 7, 8] }, { label: 'MF', idx: [5, 6] }, { label: 'DF', idx: [1, 2, 3] }],
}
const FORMATION_KEYS = Object.keys(FORMATIONS)
// 選手選択フォームで使うポジションラベル（フォーメーションごとに、そのスロット(idx)が実際に何のポジションになるかを表示）
const POSITION_LABELS = {
  '4-2-3-1': { 0: 'GK', 1: 'LDF', 2: 'CB', 3: 'CB', 4: 'RDF', 5: 'DMF', 6: 'DMF', 7: 'LMF', 8: 'OMF', 9: 'RMF', 10: 'CF' },
  '4-2-2-2': { 0: 'GK', 1: 'LDF', 2: 'CB', 3: 'CB', 4: 'RDF', 5: 'DMF', 6: 'DMF', 7: 'LMF', 8: 'RMF', 9: 'CF', 10: 'CF' },
  '3-2-3-2': { 0: 'GK', 1: 'LDF', 2: 'CB', 3: 'RDF', 4: 'LMF', 5: 'DMF', 6: 'DMF', 7: 'OMF', 8: 'RMF', 9: 'CF', 10: 'CF' },
}
// 選手選択欄の並び順（メインポジション基準。GK→DF→MF→FWの順）
const POSITION_SORT_ORDER = { GK: 0, DF: 1, MF: 2, FW: 3 }

// 試合ではないイベント種別（Admin.jsxの試合結果タブと同じ定義）
const NON_MATCH_EVENT_TYPES = ['ゴルフコンペ', 'トレーニング', 'ミーティング', '送別会／歓迎会']

const btn = (bg, color, extra = {}) => ({
  padding: '7px 14px', background: bg, color, border: 'none',
  borderRadius: '6px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer', ...extra,
})
const inputStyle = {
  width: '100%', padding: '8px 10px', border: '1.5px solid #e0dbd5',
  borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'inherit',
}
const labelStyle = { fontSize: '11.5px', fontWeight: '600', color: '#8a7f7a', display: 'block', marginBottom: '4px' }

const emptySlot = (position_index) => ({ position_index, member_id: '', sub_member_id: '', sub_minute: '' })
const emptySlots = () => Array.from({ length: 11 }, (_, i) => emptySlot(i))
// 前半・後半それぞれ独立した1セット分の状態（2026-09-27〜。以前は前半・後半で同じslotsを共有しており、
// 後半を保存すると前半の内容が上書きされたように見えてしまう不具合があったため、half単位で完全に分離した）
const emptyHalfState = () => ({ lineupId: null, subInterval: 20, formation: '4-2-3-1', slots: emptySlots() })

const tabPillStyle = (active, accent) => ({
  padding: '6px 14px', borderRadius: '20px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer', border: '2px solid',
  borderColor: active ? accent : '#ddd',
  background: active ? accent : '#ffffff',
  color: active ? '#ffffff' : '#8a7f7a',
})

const numberBadgeStyle = (color, size) => ({
  position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
  fontSize: size, fontWeight: 900, color, fontFamily: 'Arial, sans-serif',
  textShadow: '-1px -1px 0 rgba(0,0,0,.35), 1px -1px 0 rgba(0,0,0,.35), -1px 1px 0 rgba(0,0,0,.35), 1px 1px 0 rgba(0,0,0,.35)',
})

const maskOverlayStyle = {
  position: 'absolute', inset: 0, background: '#2e7d46', mixBlendMode: 'color',
  WebkitMaskImage: `url(${KIT_IMG})`, maskImage: `url(${KIT_IMG})`,
  WebkitMaskSize: 'contain', maskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center', maskPosition: 'center',
}

export default function AdminMatchLineup({ members, canU40, canO40 }) {
  const initialTeam = canU40 ? 'u40' : 'o40'
  const [team, setTeam] = useState(initialTeam)
  const [events, setEvents] = useState([])
  const [eventId, setEventId] = useState('')
  const [half, setHalf] = useState('first')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const kit = 'home' // ホーム/アウェイの切替機能は廃止（常にホーム表示）
  // 前半・後半それぞれ独立したデータとして保持する（lineupId・フォーメーション・交代タイミング基準・選手選択のすべて）
  const [halves, setHalves] = useState({ first: emptyHalfState(), second: emptyHalfState() })
  const [attendanceMap, setAttendanceMap] = useState({}) // member_id -> status（対象試合の出欠）

  useEffect(() => { fetchEvents() }, [])
  useEffect(() => {
    if (eventId) loadLineup(eventId, team)
    else setHalves({ first: emptyHalfState(), second: emptyHalfState() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, team])
  useEffect(() => { if (eventId) fetchAttendance(eventId); else setAttendanceMap({}) }, [eventId])

  const eventOptions = events.filter(e => !NON_MATCH_EVENT_TYPES.includes(e.event_type) && (e.category === 'joint' || e.category === team))

  useEffect(() => {
    // チーム切り替えで今の選択試合が対象外になったら選び直す
    if (eventId && !eventOptions.some(e => e.id === eventId)) {
      const todayStr = new Date().toISOString().slice(0, 10)
      const opts = events.filter(e => !NON_MATCH_EVENT_TYPES.includes(e.event_type) && (e.category === 'joint' || e.category === team))
      const upcoming = [...opts].sort((a, b) => a.event_date.localeCompare(b.event_date)).find(e => e.event_date >= todayStr)
      setEventId((upcoming || opts[0])?.id || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team, events])

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false })
    if (data) {
      setEvents(data)
      const todayStr = new Date().toISOString().slice(0, 10)
      const opts = data.filter(e => !NON_MATCH_EVENT_TYPES.includes(e.event_type) && (e.category === 'joint' || e.category === initialTeam))
      const upcoming = [...opts].sort((a, b) => a.event_date.localeCompare(b.event_date)).find(e => e.event_date >= todayStr)
      setEventId((upcoming || opts[0])?.id || '')
    }
    setLoading(false)
  }

  // 対象試合・チームが決まったら、前半・後半それぞれのmatch_lineups行と選手情報を個別に取得する
  const loadLineup = async (evId, tm) => {
    setLoading(true)
    const { data: lineupRows } = await supabase.from('match_lineups').select('*').eq('event_id', evId).eq('team', tm)
    const next = { first: emptyHalfState(), second: emptyHalfState() }
    for (const row of lineupRows || []) {
      const key = row.half === 'second' ? 'second' : 'first'
      const { data: playerRows } = await supabase.from('match_lineup_players').select('*').eq('lineup_id', row.id).order('position_index')
      const bySlot = emptySlots()
      ;(playerRows || []).forEach(p => {
        bySlot[p.position_index] = {
          position_index: p.position_index,
          member_id: p.member_id || '',
          sub_member_id: p.sub_member_id || '',
          sub_minute: p.sub_minute ?? '',
        }
      })
      next[key] = {
        lineupId: row.id,
        subInterval: row.sub_interval_minutes,
        formation: row.formation || '4-2-3-1',
        slots: bySlot,
      }
    }
    setHalves(next)
    setLoading(false)
  }

  // 対象試合の出欠を取得し、選手選択欄の文字色に反映する（参加=青／未定=黄／不参加=赤／それ以外・未回答=黒のまま）
  const fetchAttendance = async (evId) => {
    const { data } = await supabase.from('attendance').select('member_id, status').eq('event_id', evId)
    const map = {}
    ;(data || []).forEach(r => { map[r.member_id] = r.status })
    setAttendanceMap(map)
  }
  const ATTENDANCE_COLORS = { present: '#1a5fd6', undecided: '#c9960a', absent: '#d63a3a' }
  const attendanceTextColor = (memberId) => ATTENDANCE_COLORS[attendanceMap[memberId]] || undefined

  const current = halves[half]
  const updateCurrent = (patch) => setHalves(prev => ({ ...prev, [half]: { ...prev[half], ...patch } }))
  const updateSlot = (i, patch) => setHalves(prev => ({
    ...prev,
    [half]: { ...prev[half], slots: prev[half].slots.map((s, idx) => idx === i ? { ...s, ...patch } : s) },
  }))

  const saveLineup = async () => {
    if (!eventId) return alert('対象試合を選択してください')
    setSaving(true)
    const h = halves[half]
    let id = h.lineupId
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      event_id: eventId, team, half, kit, sub_interval_minutes: h.subInterval,
      formation: h.formation,
      updated_at: new Date().toISOString(),
    }
    if (id) {
      const { error } = await supabase.from('match_lineups').update(payload).eq('id', id)
      if (error) { alert('保存に失敗しました: ' + error.message); setSaving(false); return }
    } else {
      const { data, error } = await supabase.from('match_lineups').insert({ ...payload, created_by: user?.id }).select().single()
      if (error) { alert('保存に失敗しました: ' + error.message); setSaving(false); return }
      id = data.id
      updateCurrent({ lineupId: id })
    }
    const playerPayload = h.slots.map(s => ({
      lineup_id: id,
      position_index: s.position_index,
      member_id: s.member_id || null,
      sub_member_id: s.sub_member_id || null,
      sub_minute: s.sub_minute === '' ? null : parseInt(s.sub_minute),
    }))
    const { error: playerError } = await supabase.from('match_lineup_players').upsert(playerPayload, { onConflict: 'lineup_id,position_index' })
    if (playerError) { alert('選手情報の保存に失敗しました: ' + playerError.message); setSaving(false); return }
    setSaving(false)
    alert(`${half === 'first' ? '前半' : '後半'}を保存しました`)
  }

  // 候補選手：自チームのメンバー＋兼務メンバー（Schedule.jsxのbelongsToEventと同じ考え方）
  // 表示順はメインポジション（position1）基準でGK→DF→MF→FWの順、同ポジション内は名前順
  const candidates = members
    .filter(m => m.status !== 'left' && (m.team === team || m.dual_team))
    .sort((a, b) => {
      const pa = POSITION_SORT_ORDER[a.position1] ?? 4
      const pb = POSITION_SORT_ORDER[b.position1] ?? 4
      if (pa !== pb) return pa - pb
      return (a.name || '').localeCompare(b.name || '')
    })
  // 出欠状況の色分け（PCのselect要素は文字色でも表示されるが、機種によってはoptionの文字色指定が反映されないことがあるため、
  // 機種を問わず確実に伝わるよう絵文字の色マークを名前の前に付ける方式を主に使う（文字色は補助的に残す）
  const ATTENDANCE_DOTS = { present: '🔵', undecided: '🟡', absent: '🔴' }
  const candidateLabel = (m) => `${ATTENDANCE_DOTS[attendanceMap[m.id]] ? ATTENDANCE_DOTS[attendanceMap[m.id]] + ' ' : ''}${m.name}${m.position1 ? `｜${m.position1}` : ''}${m.jersey_home ? ` #${m.jersey_home}` : ''}`
  // GK/DF/MF/FWの区切りごとに空欄行を挟んで見やすくする
  const candidateOptions = []
  let prevGroup = null
  candidates.forEach(m => {
    const group = POSITION_SORT_ORDER[m.position1] ?? 4
    if (prevGroup !== null && group !== prevGroup) {
      candidateOptions.push({ sep: true, key: `sep-${group}-${m.id}` })
    }
    candidateOptions.push({ sep: false, member: m })
    prevGroup = group
  })

  const accent = team === 'u40' ? '#7b5ea7' : '#2a5fa5'
  const formation = current.formation
  const setFormation = (f) => updateCurrent({ formation: f })
  const subInterval = current.subInterval
  const setSubInterval = (n) => updateCurrent({ subInterval: n })
  const slots = current.slots

  const buildPlayer = (idx) => {
    const slot = slots[idx] || emptySlot(idx)
    const member = members.find(m => m.id === slot.member_id)
    const subMember = slot.sub_member_id ? members.find(m => m.id === slot.sub_member_id) : null
    const isAway = kit !== 'home'
    const numberColor = kit === 'home' ? accent : '#ffffff'
    return {
      idx,
      filled: !!member,
      number: member?.jersey_home ?? '?',
      name: member?.name || '未定',
      isAway,
      numberColor,
      hasSub: !!subMember,
      subNumber: subMember?.jersey_home ?? '?',
      subName: subMember?.name || '',
      timeLabel: subMember ? `IN ${slot.sub_minute || subInterval}'` : '',
    }
  }

  const rowsDef = FORMATIONS[formation] || FORMATIONS['4-2-3-1']
  const pitchRows = rowsDef.map(row => ({ label: row.label, players: row.idx.map(buildPlayer) }))
  const gk = buildPlayer(0)

  const JerseyIcon = ({ p, size = 58 }) => (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {p.filled ? (
        <>
          <img src={KIT_IMG} alt="" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }} />
          {p.isAway && <div style={maskOverlayStyle} />}
          <div style={numberBadgeStyle(p.numberColor, 18)}>{p.number}</div>
        </>
      ) : (
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.75)', fontSize: 20, fontWeight: 900 }}>?</div>
      )}
      {p.hasSub && (
        <div style={{ position: 'absolute', right: -16, bottom: -8, width: Math.round(size * 0.62), height: Math.round(size * 0.62), filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.4))' }}>
          <img src={KIT_IMG} alt="" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }} />
          {p.isAway && <div style={maskOverlayStyle} />}
          <div style={numberBadgeStyle(p.numberColor, 14)}>{p.subNumber}</div>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#2a2220', marginBottom: '4px' }}>🎽 試合メンバー編成</div>
      <div style={{ fontSize: '11.5px', color: '#8a7f7a', marginBottom: '14px', lineHeight: 1.6 }}>
        先発11人・フォーメーション・交代を設定し、保存後にこの画面をスマホでスクリーンショットしてチームに共有してください（前半・後半それぞれ1枚。画像の自動書き出し機能はありません）。
      </div>

      {canU40 && canO40 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={labelStyle}>チーム</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={tabPillStyle(team === 'u40', '#7b5ea7')} onClick={() => setTeam('u40')}>U-40</div>
            <div style={tabPillStyle(team === 'o40', '#2a5fa5')} onClick={() => setTeam('o40')}>O-40</div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '14px', maxWidth: '420px' }}>
        <div style={labelStyle}>対象試合</div>
        <select style={inputStyle} value={eventId} onChange={e => setEventId(e.target.value)}>
          <option value="">選択してください</option>
          {eventOptions.map(e => <option key={e.id} value={e.id}>{e.event_date} ｜ {e.title}</option>)}
        </select>
        {eventOptions.length === 0 && <div style={{ fontSize: '11.5px', color: '#8a7f7a', marginTop: '6px' }}>対象イベントがありません（先に「📅 スケジュール」タブで試合を登録してください）</div>}
      </div>

      {!eventId ? null : loading ? (
        <div style={{ color: '#8a7f7a', fontSize: '13px' }}>読み込み中...</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
            <div>
              <div style={labelStyle}>ハーフ（前半・後半で別々に選手編成・フォーメーションを保存できます）</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={tabPillStyle(half === 'first', accent)} onClick={() => setHalf('first')}>前半</div>
                <div style={tabPillStyle(half === 'second', accent)} onClick={() => setHalf('second')}>後半</div>
              </div>
            </div>
            <div>
              <div style={labelStyle}>フォーメーション（{half === 'first' ? '前半' : '後半'}）</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {FORMATION_KEYS.map(f => (
                  <div key={f} style={tabPillStyle(formation === f, accent)} onClick={() => setFormation(f)}>{f}</div>
                ))}
              </div>
            </div>
            <div>
              <div style={labelStyle}>交代タイミング基準（{half === 'first' ? '前半' : '後半'}／10分刻みで個別調整も可）</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[10, 20, 30].map(n => (
                  <div key={n} style={tabPillStyle(subInterval === n, accent)} onClick={() => setSubInterval(n)}>{n}分</div>
                ))}
              </div>
            </div>
          </div>

          {/* ピッチプレビュー */}
          <div style={{ background: 'repeating-linear-gradient(180deg, #2f8f4e 0px, #2f8f4e 42px, #34995a 42px, #34995a 84px)', borderRadius: '16px', padding: '70px 6px 26px', position: 'relative', border: '2px solid rgba(255,255,255,0.6)', overflow: 'hidden', maxWidth: '390px' }}>
            <div style={{ position: 'absolute', inset: 0 }}>
              <div style={{ position: 'absolute', left: '5%', right: '5%', top: '50%', height: '2px', background: 'rgba(255,255,255,0.6)' }} />
              <div style={{ position: 'absolute', left: '50%', top: '50%', width: '90px', height: '90px', marginLeft: '-45px', marginTop: '-45px', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', left: '50%', top: '50%', width: '4px', height: '4px', marginLeft: '-2px', marginTop: '-2px', background: 'rgba(255,255,255,0.7)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', left: '20%', right: '20%', top: 0, height: '13%', border: '2px solid rgba(255,255,255,0.5)', borderTop: 'none' }} />
              <div style={{ position: 'absolute', left: '35%', right: '35%', top: 0, height: '5.5%', border: '2px solid rgba(255,255,255,0.5)', borderTop: 'none' }} />
              <div style={{ position: 'absolute', left: '20%', right: '20%', bottom: 0, height: '13%', border: '2px solid rgba(255,255,255,0.5)', borderBottom: 'none' }} />
              <div style={{ position: 'absolute', left: '35%', right: '35%', bottom: 0, height: '5.5%', border: '2px solid rgba(255,255,255,0.5)', borderBottom: 'none' }} />
              <div style={{ position: 'absolute', left: 0, top: 0, width: '16px', height: '16px', borderRight: '2px solid rgba(255,255,255,0.5)', borderBottom: '2px solid rgba(255,255,255,0.5)', borderBottomRightRadius: '16px' }} />
              <div style={{ position: 'absolute', right: 0, top: 0, width: '16px', height: '16px', borderLeft: '2px solid rgba(255,255,255,0.5)', borderBottom: '2px solid rgba(255,255,255,0.5)', borderBottomLeftRadius: '16px' }} />
              <div style={{ position: 'absolute', left: 0, bottom: 0, width: '16px', height: '16px', borderRight: '2px solid rgba(255,255,255,0.5)', borderTop: '2px solid rgba(255,255,255,0.5)', borderTopRightRadius: '16px' }} />
              <div style={{ position: 'absolute', right: 0, bottom: 0, width: '16px', height: '16px', borderLeft: '2px solid rgba(255,255,255,0.5)', borderTop: '2px solid rgba(255,255,255,0.5)', borderTopLeftRadius: '16px' }} />
            </div>

            <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 6, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <img src="/logo.jpg" alt="SJFC" style={{ width: '76px', height: '76px', borderRadius: '50%', objectFit: 'cover', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }} />
              <div style={{ marginTop: '4px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '23px', letterSpacing: '1.5px', color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.6)', lineHeight: 1 }}>{team === 'u40' ? 'U-40' : 'O-40'}</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#fef3d0', textShadow: '0 1px 2px rgba(0,0,0,0.55)', lineHeight: 1.3, marginTop: '1px' }}>{half === 'first' ? '前半' : '後半'}</div>
            </div>

            {pitchRows.map((row, ri) => (
              <div key={ri} style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 2px', position: 'relative' }}>
                {row.players.map(p => (
                  <div key={p.idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <JerseyIcon p={p} />
                    <div style={{ marginTop: '4px', fontSize: '13px', color: '#ffffff', fontWeight: 900, textAlign: 'center', lineHeight: 1.15, textShadow: '0 1px 3px rgba(0,0,0,0.55)', maxWidth: '80px' }}>{p.name}</div>
                    {p.hasSub && (
                      <div style={{ fontSize: '13px', color: '#ffe45e', textAlign: 'center', fontWeight: 900, textShadow: '0 1px 2px rgba(0,0,0,0.75)', marginTop: '2px' }}>{p.timeLabel} → {p.subName}</div>
                    )}
                  </div>
                ))}
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 4px 2px', position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <JerseyIcon p={gk} />
                <div style={{ marginTop: '4px', fontSize: '13px', color: '#ffffff', fontWeight: 900, textAlign: 'center', lineHeight: 1.15, textShadow: '0 1px 3px rgba(0,0,0,0.55)' }}>{gk.name}</div>
                {gk.hasSub && (
                  <div style={{ fontSize: '13px', color: '#ffe45e', textAlign: 'center', fontWeight: 900, textShadow: '0 1px 2px rgba(0,0,0,0.75)', marginTop: '2px' }}>{gk.timeLabel} → {gk.subName}</div>
                )}
              </div>
            </div>
          </div>

          <div style={{ padding: '10px 12px', background: '#ffffff', borderRadius: '8px', fontSize: '11.5px', color: '#555555', border: '1px solid #e0dbd5', lineHeight: 1.5, margin: '10px 0 20px' }}>
            📸 共有方法：この画面をそのままスマホでスクリーンショットして、前半・後半それぞれ1枚をチームに共有してください（システムによる画像自動生成はありません）。
          </div>

          {/* 選手選択フォーム */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#2a2220', marginBottom: '10px' }}>
              選手選択（{half === 'first' ? '前半' : '後半'}／{team === 'u40' ? 'U-40' : 'O-40'}メンバー＋兼務メンバーから選択）
            </div>
            <div style={{ fontSize: '10.5px', color: '#8a7f7a', marginBottom: '10px', marginTop: '-4px' }}>
              対象試合の出欠状況：🔵参加　🟡未定　🔴不参加（無印は遅刻・早退・未回答など）
            </div>
            {slots.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f0ebe5', flexWrap: 'wrap' }}>
                <div style={{ width: '34px', fontSize: '11px', fontWeight: '700', color: '#8a7f7a', flexShrink: 0 }}>{(POSITION_LABELS[formation] || POSITION_LABELS['4-2-3-1'])[i]}</div>
                <select style={{ ...inputStyle, flex: 1, minWidth: '140px' }} value={s.member_id} onChange={e => updateSlot(i, { member_id: e.target.value })}>
                  <option value="">未定</option>
                  {candidateOptions.map(o => o.sep
                    ? <option key={o.key} disabled>{' '}</option>
                    : <option key={o.member.id} value={o.member.id} style={{ color: attendanceTextColor(o.member.id) }}>{candidateLabel(o.member)}</option>)}
                </select>
                <select style={{ ...inputStyle, width: '170px', flexShrink: 0 }} value={s.sub_member_id} onChange={e => updateSlot(i, { sub_member_id: e.target.value, sub_minute: e.target.value ? s.sub_minute : '' })}>
                  <option value="">交代なし</option>
                  {candidateOptions.map(o => o.sep
                    ? <option key={o.key} disabled>{' '}</option>
                    : <option key={o.member.id} value={o.member.id} style={{ color: attendanceTextColor(o.member.id) }}>{candidateLabel(o.member)}</option>)}
                </select>
                {s.sub_member_id && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <input style={{ ...inputStyle, width: '64px' }} type="number" placeholder={String(subInterval)} value={s.sub_minute} onChange={e => updateSlot(i, { sub_minute: e.target.value })} />
                    <span style={{ fontSize: '11.5px', color: '#8a7f7a' }}>分〜IN</span>
                  </div>
                )}
              </div>
            ))}
            <div style={{ fontSize: '10.5px', color: '#8a7f7a', marginTop: '10px', lineHeight: 1.5 }}>
              ※ このフォームでは1ポジションにつき交代1回までの入力です。同じポジションで複数回交代がある場合は今後の拡張課題とします。
            </div>
            <div style={{ textAlign: 'right', marginTop: '14px' }}>
              <button style={btn('#e8c84a', '#2a2220', { padding: '9px 22px', fontSize: '13px', fontWeight: '700', opacity: saving ? 0.6 : 1 })} disabled={saving} onClick={saveLineup}>
                {saving ? '保存中...' : `💾 ${half === 'first' ? '前半' : '後半'}を保存する`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
