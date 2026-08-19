import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import AdminPayments from '../components/AdminPayments'

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

const RETIRED_NUMBERS = [3, 5] // 永久欠番

const TIME_OPTIONS = []
for (let h = 0; h < 24; h++) {
  for (let m of [0, 30]) {
    TIME_OPTIONS.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  }
}

const TimeInput = ({ value, onChange }) => (
  <div>
    <input list="time-options" style={inputStyle} value={value}
      onChange={e => onChange(e.target.value)} placeholder="例：07:00" />
    <datalist id="time-options">
      {TIME_OPTIONS.map(t => <option key={t} value={t} />)}
    </datalist>
  </div>
)

export default function Admin() {
  const [tab, setTab] = useState('members')
  const [members, setMembers] = useState([])
  const [events, setEvents] = useState([])
  const [matches, setMatches] = useState([])
  const [masters, setMasters] = useState({ event_type: [], venue: [], meetup_place: [] })
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Member modal
  const [memberModal, setMemberModal] = useState(false)
  const [editMember, setEditMember] = useState(null)
  const [memberForm, setMemberForm] = useState({
    name: '', name_romaji: '', team: 'u40', position1: 'MF', position2: '',
    birth_year: '', birth_month: '', birth_day: '', joined_at: '', status: 'active', dues_type: 'monthly',
    jersey_home: '', jersey_away: '', email: '', password: '', dual_team: false
  })

  // Event modal
  const [eventModal, setEventModal] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [eventForm, setEventForm] = useState({
    title: '', category: 'u40', event_type: '', event_date: '',
    venue: '', kickoff_time: '', end_time: '', meetup_time: '', meetup_place: '', deadline: '', notes: ''
  })

  // Match modal
  const [matchModal, setMatchModal] = useState(false)
  const [editMatch, setEditMatch] = useState(null)
  const [matchForm, setMatchForm] = useState({
    team: 'u40', opponent: '', match_date: '', venue: '',
    home_away: 'home', match_type: '公式戦', score_us: 0, score_them: 0, notes: ''
  })
  const [scorerInputs, setScorerInputs] = useState([{ member_id: '', minute: '', assist_member_id: '' }])

  // Sponsors
  const [sponsors, setSponsors] = useState([])
  const [sponsorModal, setSponsorModal] = useState(false)
  const [editSponsor, setEditSponsor] = useState(null)
  const [sponsorForm, setSponsorForm] = useState({
    name: '', category: 'general', description: '', benefits: '',
    website_url: '', address: '', phone: '', logo_url: '', sort_order: 0, is_active: true
  })
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUploadError, setLogoUploadError] = useState('')

  // 会計（出納帳）
  const [isTreasurer, setIsTreasurer] = useState(false)
  const [isTreasurerAdmin, setIsTreasurerAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [wallets, setWallets] = useState([])
  const [transactions, setTransactions] = useState([])
  const todayStr = new Date().toISOString().split('T')[0]
  const [txForm, setTxForm] = useState({ wallet_id: '', date: todayStr, type: 'income', category: '部費', customCategory: '', amount: '', memo: '' })
  const [txWalletFilter, setTxWalletFilter] = useState('all')
  const [editingHolderId, setEditingHolderId] = useState(null)
  const [holderNameInput, setHolderNameInput] = useState('')

  // Master
  const [newMasterValue, setNewMasterValue] = useState({ event_type: '', venue: '', meetup_place: '' })

  // Org chart（体制図）
  const [orgChart, setOrgChart] = useState([])
  const [orgModal, setOrgModal] = useState(false)
  const [editOrg, setEditOrg] = useState(null)
  const [orgForm, setOrgForm] = useState({ section: 'club', role_title: '', names: '', member_ids: [], sort_order: 0 })
  const [orgMemberSearch, setOrgMemberSearch] = useState('')

  useEffect(() => { checkAdmin() }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setCurrentUserId(user.id)
    const { data } = await supabase.from('profiles').select('role, is_treasurer').eq('id', user.id).single()
    if (data?.role === 'admin') {
      setIsAdmin(true)
      fetchMembers()
      fetchEvents()
      fetchMatches()
      fetchSponsors()
      fetchMasters()
      fetchOrgChart()
    }
    if (data?.is_treasurer) {
      setIsTreasurer(true)
      fetchWallets()
      fetchTransactions()
    }
    if (user.email === 'vespa9304@gmail.com') setIsTreasurerAdmin(true)
    setLoading(false)
  }

  const fetchMembers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('team').order('name')
    if (data) setMembers(data)
  }

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('event_date')
    if (data) setEvents(data)
  }

  const fetchMatches = async () => {
    const { data } = await supabase.from('matches').select('*').order('match_date', { ascending: false })
    if (data) setMatches(data)
  }

  const fetchSponsors = async () => {
    const { data } = await supabase.from('sponsors').select('*').order('sort_order')
    if (data) setSponsors(data)
  }

  const openAddSponsor = () => {
    setEditSponsor(null)
    setSponsorForm({ name: '', category: 'general', description: '', benefits: '', website_url: '', address: '', phone: '', logo_url: '', sort_order: 0, is_active: true })
    setSponsorModal(true)
  }

  const openEditSponsor = (sp) => {
    setEditSponsor(sp)
    setSponsorForm({ name: sp.name, category: sp.category, description: sp.description || '', benefits: sp.benefits || '', website_url: sp.website_url || '', address: sp.address || '', phone: sp.phone || '', logo_url: sp.logo_url || '', sort_order: sp.sort_order || 0, is_active: sp.is_active })
    setSponsorModal(true)
  }

  const saveSponsor = async () => {
    if (!sponsorForm.name) return alert('企業名は必須です')
    if (editSponsor) {
      await supabase.from('sponsors').update(sponsorForm).eq('id', editSponsor.id)
    } else {
      await supabase.from('sponsors').insert(sponsorForm)
    }
    setSponsorModal(false)
    fetchSponsors()
  }

  const deleteSponsor = async (id) => {
    if (!window.confirm('削除しますか？')) return
    await supabase.from('sponsors').delete().eq('id', id)
    fetchSponsors()
  }

  const uploadSponsorLogo = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setLogoUploadError('画像ファイルを選んでください'); return }
    if (file.size > 3 * 1024 * 1024) { setLogoUploadError('3MB以下の画像にしてください'); return }
    setLogoUploadError('')
    setLogoUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await supabase.storage.from('sponsor-logos').upload(path, file, { upsert: true })
    if (error) {
      setLogoUploadError('アップロードに失敗しました：' + error.message)
      setLogoUploading(false)
      return
    }
    const { data } = supabase.storage.from('sponsor-logos').getPublicUrl(path)
    setSponsorForm(f => ({ ...f, logo_url: data.publicUrl }))
    setLogoUploading(false)
  }

  const fetchOrgChart = async () => {
    const { data } = await supabase.from('org_chart').select('*').order('section').order('sort_order')
    if (data) setOrgChart(data)
  }

  const openAddOrg = (section) => {
    setEditOrg(null)
    const sectionRows = orgChart.filter(o => o.section === (section || 'club'))
    const maxOrder = sectionRows.length > 0 ? Math.max(...sectionRows.map(o => o.sort_order || 0)) : 0
    setOrgForm({ section: section || 'club', role_title: '', names: '', member_ids: [], sort_order: maxOrder + 1 })
    setOrgMemberSearch('')
    setOrgModal(true)
  }

  const openEditOrg = (o) => {
    setEditOrg(o)
    setOrgForm({ section: o.section, role_title: o.role_title, names: o.names || '', member_ids: o.member_ids || [], sort_order: o.sort_order || 0 })
    setOrgMemberSearch('')
    setOrgModal(true)
  }

  const toggleOrgMember = (memberId) => {
    setOrgForm(prev => ({
      ...prev,
      member_ids: prev.member_ids.includes(memberId)
        ? prev.member_ids.filter(id => id !== memberId)
        : [...prev.member_ids, memberId]
    }))
  }

  const saveOrg = async () => {
    if (!orgForm.role_title) return alert('役職名は必須です')
    const payload = { ...orgForm, updated_at: new Date().toISOString() }
    if (editOrg) {
      await supabase.from('org_chart').update(payload).eq('id', editOrg.id)
    } else {
      await supabase.from('org_chart').insert(payload)
    }
    setOrgModal(false)
    fetchOrgChart()
  }

  const deleteOrg = async (id) => {
    if (!window.confirm('削除しますか？')) return
    await supabase.from('org_chart').delete().eq('id', id)
    fetchOrgChart()
  }

  const fetchMasters = async () => {
    const { data } = await supabase.from('masters').select('*').order('sort_order')
    if (data) {
      setMasters({
        event_type: data.filter(d => d.category === 'event_type'),
        venue: data.filter(d => d.category === 'venue'),
        meetup_place: data.filter(d => d.category === 'meetup_place'),
      })
    }
  }

  const addMaster = async (category) => {
    const value = newMasterValue[category].trim()
    if (!value) return
    const maxOrder = masters[category].length > 0 ? Math.max(...masters[category].map(m => m.sort_order)) : 0
    await supabase.from('masters').insert({ category, value, sort_order: maxOrder + 1 })
    setNewMasterValue({ ...newMasterValue, [category]: '' })
    fetchMasters()
  }

  const deleteMaster = async (id) => {
    if (!window.confirm('削除しますか？')) return
    await supabase.from('masters').delete().eq('id', id)
    fetchMasters()
  }

  // 会計（出納帳）
  const fetchWallets = async () => {
    const { data } = await supabase.from('wallets').select('*').order('sort_order')
    if (data) setWallets(data)
  }

  const fetchTransactions = async () => {
    const { data } = await supabase.from('accounting_transactions').select('*').order('date', { ascending: false }).order('created_at', { ascending: false })
    if (data) setTransactions(data)
  }

  const INCOME_CATEGORIES = ['部費', 'ユニフォーム代', 'その他（自由入力）']
  const EXPENSE_CATEGORIES = ['グランド代', 'ストリーミング代', 'タクシー代', '雑費', 'その他（自由入力）']

  const fmtVND = (n) => Math.round(n || 0).toLocaleString('ja-JP') + ' ₫'

  const walletBalance = (walletId) => {
    const w = wallets.find(w => w.id === walletId)
    if (!w) return 0
    const sum = transactions.filter(t => t.wallet_id === walletId)
      .reduce((s, t) => s + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0)
    return Number(w.starting_balance) + sum
  }

  const totalBalance = () => wallets.reduce((s, w) => s + walletBalance(w.id), 0)

  const openHolderEdit = (w) => { setEditingHolderId(w.id); setHolderNameInput(w.holder_name) }

  const saveHolderName = async (walletId) => {
    if (!holderNameInput.trim()) return
    await supabase.from('wallets').update({ holder_name: holderNameInput.trim() }).eq('id', walletId)
    setEditingHolderId(null)
    fetchWallets()
  }

  const saveTransaction = async () => {
    if (!txForm.wallet_id) return alert('財布を選択してください')
    if (!txForm.date) return alert('日付を入力してください')
    const amount = parseFloat(txForm.amount)
    if (!amount || amount <= 0) return alert('金額を正しく入力してください')
    const category = txForm.category === 'その他（自由入力）' ? (txForm.customCategory.trim() || 'その他') : txForm.category
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('accounting_transactions').insert({
      wallet_id: txForm.wallet_id, date: txForm.date, type: txForm.type, category, amount, memo: txForm.memo || null, created_by: user.id
    })
    setTxForm({ wallet_id: txForm.wallet_id, date: txForm.date, type: 'income', category: '部費', customCategory: '', amount: '', memo: '' })
    fetchTransactions()
  }

  const deleteTransaction = async (id) => {
    if (!window.confirm('この取引を削除しますか？')) return
    await supabase.from('accounting_transactions').delete().eq('id', id)
    fetchTransactions()
  }

  const toggleTreasurer = async (memberId, newVal) => {
    await supabase.from('profiles').update({ is_treasurer: newVal }).eq('id', memberId)
    fetchMembers()
  }

  // 管理者権限の付与・解除（芦田のみ操作可）
  const toggleAdminRole = async (memberId, makeAdmin) => {
    if (!window.confirm(makeAdmin ? 'この人を管理者にしますか？' : 'この人の管理者権限を外しますか？（会計担当権限も同時に外れます）')) return
    await supabase.from('profiles').update({ role: makeAdmin ? 'admin' : 'member', ...(makeAdmin ? {} : { is_treasurer: false }) }).eq('id', memberId)
    fetchMembers()
  }

  // Member CRUD
  const openAddMember = () => {
    setEditMember(null)
    setMemberForm({ name: '', name_romaji: '', team: 'u40', position1: 'MF', position2: '', birth_year: '', birth_month: '', birth_day: '', joined_at: '', status: 'active', dues_type: 'monthly', jersey_home: '', jersey_away: '', email: '', password: '', dual_team: false })
    setMemberModal(true)
  }

  const openEditMember = (m) => {
    setEditMember(m)
    setMemberForm({ name: m.name || '', name_romaji: m.name_romaji || '', team: m.team || 'u40', position1: m.position1 || 'MF', position2: m.position2 || '', birth_year: m.birth_year || '', birth_month: m.birth_month || '', birth_day: m.birth_day || '', joined_at: m.joined_at || '', status: m.status || 'active', dues_type: m.dues_type || 'monthly', jersey_home: m.jersey_home || '', jersey_away: m.jersey_away || '', email: '', password: '', dual_team: m.dual_team || false })
    setMemberModal(true)
  }

  const saveMember = async () => {
    if (!memberForm.name) return alert('氏名は必須です')
    const profileData = {
      name: memberForm.name, name_romaji: memberForm.name_romaji || null, team: memberForm.team, position1: memberForm.position1,
      position2: memberForm.position2 || null,
      birth_year: memberForm.birth_year ? parseInt(memberForm.birth_year) : null,
      birth_month: memberForm.birth_month ? parseInt(memberForm.birth_month) : null,
      birth_day: memberForm.birth_day ? parseInt(memberForm.birth_day) : null,
      joined_at: memberForm.joined_at || null, status: memberForm.status, dues_type: memberForm.dues_type,
      jersey_home: memberForm.jersey_home ? parseInt(memberForm.jersey_home) : null,
      jersey_away: memberForm.jersey_away ? parseInt(memberForm.jersey_away) : null,
      dual_team: !!memberForm.dual_team,
    }
    if (editMember) {
      await supabase.from('profiles').update(profileData).eq('id', editMember.id)
    } else {
      if (!memberForm.email || !memberForm.password) return alert('新規追加にはメールとパスワードが必要です')
      const { data: authData, error } = await supabase.auth.admin.createUser({ email: memberForm.email, password: memberForm.password, email_confirm: true })
      if (error) return alert('ユーザー作成エラー: ' + error.message)
      await supabase.from('profiles').insert({ ...profileData, id: authData.user.id })
    }
    setMemberModal(false)
    fetchMembers()
  }

  // Event CRUD
  const openAddEvent = () => {
    setEditEvent(null)
    setEventForm({ title: '', category: 'u40', event_type: '', event_date: '', venue: '', kickoff_time: '', end_time: '', meetup_time: '', meetup_place: '', deadline: '', notes: '' })
    setEventModal(true)
  }

  const openEditEvent = (ev) => {
    setEditEvent(ev)
    setEventForm({ title: ev.title || '', category: ev.category || 'u40', event_type: ev.event_type || '', event_date: ev.event_date || '', venue: ev.venue || '', kickoff_time: ev.kickoff_time ? ev.kickoff_time.slice(0,5) : '', end_time: ev.end_time ? ev.end_time.slice(0,5) : '', meetup_time: ev.meetup_time ? ev.meetup_time.slice(0,5) : '', meetup_place: ev.meetup_place || '', deadline: ev.deadline || '', notes: ev.notes || '' })
    setEventModal(true)
  }

  const saveEvent = async () => {
    if (!eventForm.title || !eventForm.event_date) return alert('タイトルと日付は必須です')
    const { data: { user } } = await supabase.auth.getUser()
    const payload = { ...eventForm, kickoff_time: eventForm.kickoff_time || null, end_time: eventForm.end_time || null, meetup_time: eventForm.meetup_time || null, deadline: eventForm.deadline || null }
    if (editEvent) {
      await supabase.from('events').update(payload).eq('id', editEvent.id)
    } else {
      await supabase.from('events').insert({ ...payload, created_by: user.id })
    }
    setEventModal(false)
    setEditEvent(null)
    fetchEvents()
  }

  const deleteEvent = async (id) => {
    if (!window.confirm('削除しますか？')) return
    await supabase.from('events').delete().eq('id', id)
    fetchEvents()
  }

  // Match CRUD
  const openAddMatch = () => {
    setEditMatch(null)
    setMatchForm({ event_id: '', team: 'u40', opponent: '', match_date: '', venue: '', home_away: 'home', match_type: '公式戦', score_us: 0, score_them: 0, notes: '' })
    setScorerInputs([{ member_id: '', minute: '', assist_member_id: '' }])
    setMatchModal(true)
  }

  const openEditMatch = async (m) => {
    setEditMatch(m)
    setMatchForm({ event_id: m.event_id || '', team: m.team, opponent: m.opponent, match_date: m.match_date, venue: m.venue || '', home_away: m.home_away, match_type: m.match_type, score_us: m.score_us, score_them: m.score_them, notes: m.notes || '' })
    const { data: g } = await supabase.from('goals').select('*').eq('match_id', m.id)
    setScorerInputs(g && g.length > 0 ? g.map(goal => ({ member_id: goal.member_id, minute: goal.minute || '', assist_member_id: goal.assist_member_id || '' })) : [{ member_id: '', minute: '', assist_member_id: '' }])
    setMatchModal(true)
  }

  // 過去の試合系イベント（スケジュールから）
  const matchEvents = events.filter(ev =>
    ['公式戦','フレンドリー','カップ戦','遠征'].includes(ev.event_type) &&
    ev.event_date < new Date().toISOString().split('T')[0]
  ).sort((a, b) => b.event_date.localeCompare(a.event_date))

  const onSelectEvent = (eventId) => {
    const ev = events.find(e => e.id === eventId)
    if (ev) {
      setMatchForm(prev => ({
        ...prev,
        event_id: ev.id,
        team: ev.category === 'joint' ? prev.team : ev.category,
        match_date: ev.event_date,
        venue: ev.venue || '',
        match_type: ev.event_type || '公式戦',
      }))
    } else {
      setMatchForm(prev => ({ ...prev, event_id: '' }))
    }
  }

  const saveMatch = async () => {
    if (!matchForm.opponent || !matchForm.match_date) return alert('相手チームと日付は必須です')
    const { data: { user } } = await supabase.auth.getUser()
    let matchId
    const payload = {
      ...matchForm,
      event_id: matchForm.event_id || null,
      score_us: parseInt(matchForm.score_us),
      score_them: parseInt(matchForm.score_them)
    }
    if (editMatch) {
      await supabase.from('matches').update(payload).eq('id', editMatch.id)
      matchId = editMatch.id
      await supabase.from('goals').delete().eq('match_id', matchId)
    } else {
      const { data } = await supabase.from('matches').insert({ ...payload, created_by: user.id }).select().single()
      matchId = data.id
    }
    const validGoals = scorerInputs.filter(s => s.member_id).map(s => ({ match_id: matchId, member_id: s.member_id, minute: s.minute ? parseInt(s.minute) : null, assist_member_id: s.assist_member_id || null }))
    if (validGoals.length > 0) await supabase.from('goals').insert(validGoals)
    setMatchModal(false)
    setEditMatch(null)
    fetchMatches()
  }

  const deleteMatch = async (id) => {
    if (!window.confirm('削除しますか？')) return
    await supabase.from('goals').delete().eq('match_id', id)
    await supabase.from('matches').delete().eq('id', id)
    fetchMatches()
  }

  const addScorer = () => setScorerInputs([...scorerInputs, { member_id: '', minute: '', assist_member_id: '' }])
  const removeScorer = (i) => setScorerInputs(scorerInputs.filter((_, idx) => idx !== i))
  const updateScorer = (i, field, value) => setScorerInputs(scorerInputs.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  // 得点者・アシスト選手候補：メインチームが一致する選手 ＋ 兼務フラグが立っている選手（他チーム所属でも選択可）
  const scorerCandidates = (team) => members
    .filter(m => m.team === team || m.dual_team)
    .sort((a, b) => (a.team === team ? 0 : 1) - (b.team === team ? 0 : 1))

  const teamBadge = (team) => (
    <span style={{ background: team === 'u40' ? '#ede8f7' : '#dceeff', color: team === 'u40' ? '#7b5ea7' : '#2a5fa5', fontSize: '10.5px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px' }}>
      {team === 'u40' ? 'U-40' : 'O-40'}
    </span>
  )

  const catLabel = (cat) => {
    if (cat === 'u40') return <span style={{ background: '#ede8f7', color: '#7b5ea7', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>U-40</span>
    if (cat === 'o40') return <span style={{ background: '#dceeff', color: '#2a5fa5', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>O-40</span>
    return <span style={{ background: '#fef3e2', color: '#e8a020', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>合同</span>
  }

  const resultTag = (m) => {
    if (m.score_us > m.score_them) return <span style={{ background: '#d4f4e0', color: '#1a7a40', fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px' }}>WIN</span>
    if (m.score_us === m.score_them) return <span style={{ background: '#e8eaf6', color: '#3949ab', fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px' }}>DRAW</span>
    return <span style={{ background: '#fde8e6', color: '#c0392b', fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px' }}>LOSS</span>
  }

  const TABS = [
    ['schedule', '📅 スケジュール'],
    ['members', '👥 メンバー'],
    ['matches', '🏆 試合結果'],
    ['payments', '💴 部費'],
    ['jersey', '👕 背番号'],
    ['sponsors', '🤝 協賛'],
    ['orgchart', '🧑‍🤝‍🧑 体制図'],
    ['master', '⚙️ マスタ'],
    ...(isTreasurer ? [['accounting', '💰 会計']] : []),
  ]

  const adminTabStyle = (t) => ({
    flex: '0 0 auto', minWidth: '92px', padding: '10px 10px', textAlign: 'center', fontSize: '11.5px', fontWeight: '600',
    cursor: 'pointer', color: tab === t ? '#e8c84a' : '#8a7f7a',
    background: tab === t ? '#2a2220' : 'white', transition: 'all .15s',
    borderRight: '1.5px solid #e0dbd5', whiteSpace: 'nowrap'
  })

  const MasterSection = ({ category, title }) => {
    const [inputVal, setInputVal] = useState('')
    const handleAdd = async () => {
      const value = inputVal.trim()
      if (!value) return
      const maxOrder = masters[category].length > 0 ? Math.max(...masters[category].map(m => m.sort_order)) : 0
      await supabase.from('masters').insert({ category, value, sort_order: maxOrder + 1 })
      setInputVal('')
      fetchMasters()
    }
    return (
      <div style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#2a2220', marginBottom: '12px' }}>{title}</div>
        {masters[category].map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0ebe5', fontSize: '13px' }}>
            <span>{m.value}</span>
            <button style={btn('#e74c3c', 'white', { padding: '3px 9px', fontSize: '11px' })} onClick={() => deleteMaster(m.id)}>削除</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
          <input style={{ ...inputStyle, flex: 1 }} value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="新しい項目を入力"
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <button style={btn('#e8c84a', '#2a2220')} onClick={handleAdd}>＋追加</button>
        </div>
      </div>
    )
  }

  if (loading) return <div style={{ color: '#8a7f7a', fontSize: '13px' }}>読み込み中...</div>
  if (!isAdmin) return <div style={{ background: 'white', borderRadius: '10px', padding: '40px', textAlign: 'center', color: '#e74c3c' }}>⚠️ 管理者権限が必要です</div>

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2a2220', letterSpacing: '2px', marginBottom: '20px' }}>
        管理者設定 <span style={{ background: '#e8c84a', color: '#2a2220', fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '3px', verticalAlign: 'middle' }}>ADMIN</span>
      </div>

      <div style={{ display: 'flex', border: '1.5px solid #e0dbd5', borderRadius: '8px', overflow: 'hidden', background: 'white', marginBottom: '18px', overflowX: 'auto' }}>
        {TABS.map(([t, l], i) => (
          <div key={t} style={{ ...adminTabStyle(t), borderRight: i === TABS.length - 1 ? 'none' : '1.5px solid #e0dbd5' }} onClick={() => setTab(t)}>{l}</div>
        ))}
      </div>

      {/* メンバー管理 */}
      {tab === 'members' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', color: '#8a7f7a' }}>全{members.length}名</div>
            <button style={btn('#2a2220', '#e8c84a')} onClick={openAddMember}>＋ メンバー追加</button>
          </div>
          <div style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '760px' }}>
                <thead>
                  <tr>{[...['名前','チーム','ポジション','生年','入部','支払区分','ステータス'], ...(isTreasurerAdmin ? ['管理者権限'] : []), '操作'].map(h => (
                    <th key={h} style={{ background: '#2a2220', color: '#e8c84a', padding: '9px 12px', textAlign: 'left', fontSize: '12px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f0ebe5' }}>
                      <td style={{ padding: '9px 12px', fontWeight: '500', whiteSpace: 'nowrap' }}>{m.name}</td>
                      <td style={{ padding: '9px 12px' }}>
                        {teamBadge(m.team)}
                        {m.dual_team && <span style={{ marginLeft: '4px', background: '#fff3cd', color: '#856404', fontSize: '10px', fontWeight: '700', padding: '1px 5px', borderRadius: '3px' }}>兼務</span>}
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ background: '#e8e0d8', color: '#2a2220', fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '3px', marginRight: '3px' }}>{m.position1}</span>
                        {m.position2 && <span style={{ background: '#e8e0d8', color: '#2a2220', fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '3px' }}>{m.position2}</span>}
                      </td>
                      <td style={{ padding: '9px 12px', color: '#8a7f7a' }}>{m.birth_year ? `${m.birth_year}年${m.birth_month ? m.birth_month + '月' : ''}${m.birth_day ? m.birth_day + '日' : ''}` : '－'}</td>
                      <td style={{ padding: '9px 12px', color: '#8a7f7a' }}>{m.joined_at ? m.joined_at.slice(0,7).replace('-','/') : '－'}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ background: m.dues_type === 'spot' ? '#fff3cd' : '#e8e0d8', color: m.dues_type === 'spot' ? '#856404' : '#8a7f7a', fontSize: '10.5px', fontWeight: '600', padding: '2px 6px', borderRadius: '4px' }}>
                          {m.dues_type === 'spot' ? '都度払い' : '月額払い'}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ background: m.status === 'active' ? '#d4f4e0' : '#fff3cd', color: m.status === 'active' ? '#1a7a40' : '#856404', fontSize: '11px', fontWeight: '600', padding: '2px 7px', borderRadius: '4px' }}>
                          {m.status === 'active' ? '在籍' : '休止中'}
                        </span>
                      </td>
                      {isTreasurerAdmin && (
                        <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                          <span style={{ background: m.role === 'admin' ? '#e8e0d8' : '#f0ebe5', color: m.role === 'admin' ? '#2a2220' : '#b0a89f', fontSize: '10.5px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px', marginRight: '6px' }}>
                            {m.role === 'admin' ? '管理者' : '一般'}
                          </span>
                          {m.role === 'admin' ? (
                            <button style={btn('#e74c3c', 'white', { padding: '3px 8px', fontSize: '11px', ...(m.id === currentUserId ? { opacity: 0.4, cursor: 'not-allowed' } : {}) })} disabled={m.id === currentUserId} onClick={() => toggleAdminRole(m.id, false)}>解除</button>
                          ) : (
                            <button style={btn('#e8c84a', '#2a2220', { padding: '3px 8px', fontSize: '11px' })} onClick={() => toggleAdminRole(m.id, true)}>付与</button>
                          )}
                        </td>
                      )}
                      <td style={{ padding: '9px 12px' }}>
                        <button style={btn('transparent', '#2a2220', { border: '1.5px solid #ddd', padding: '4px 9px', fontSize: '11.5px' })} onClick={() => openEditMember(m)}>編集</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* スケジュール */}
      {tab === 'schedule' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '13px', color: '#8a7f7a' }}>全{events.length}件</div>
            <button style={btn('#2a2220', '#e8c84a', { padding: '13px 28px', fontSize: '15px', fontWeight: '700', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' })} onClick={openAddEvent}>＋ イベントを追加</button>
          </div>
          <div style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '900px' }}>
                <thead>
                  <tr>{['日付','カテゴリー','タイトル','種別','場所','KO','集合','締切','操作'].map(h => (
                    <th key={h} style={{ background: '#2a2220', color: '#e8c84a', padding: '9px 12px', textAlign: 'left', fontSize: '12px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {events.length === 0 && <tr><td colSpan={9} style={{ padding: '20px', textAlign: 'center', color: '#8a7f7a' }}>イベントはありません</td></tr>}
                  {events.map(ev => (
                    <tr key={ev.id} style={{ borderBottom: '1px solid #f0ebe5' }}>
                      <td style={{ padding: '9px 12px', color: '#8a7f7a', whiteSpace: 'nowrap' }}>{ev.event_date}</td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{catLabel(ev.category)}</td>
                      <td style={{ padding: '9px 12px', fontWeight: '500', whiteSpace: 'nowrap' }}>{ev.title}</td>
                      <td style={{ padding: '9px 12px', color: '#8a7f7a', whiteSpace: 'nowrap' }}>{ev.event_type}</td>
                      <td style={{ padding: '9px 12px', color: '#8a7f7a', whiteSpace: 'nowrap' }}>{ev.venue || '－'}</td>
                      <td style={{ padding: '9px 12px', color: '#8a7f7a' }}>{ev.kickoff_time ? ev.kickoff_time.slice(0,5) : '－'}</td>
                      <td style={{ padding: '9px 12px', color: '#8a7f7a' }}>{ev.meetup_time ? ev.meetup_time.slice(0,5) : '－'}</td>
                      <td style={{ padding: '9px 12px', color: '#8a7f7a' }}>{ev.deadline || '－'}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button style={btn('transparent', '#2a2220', { border: '1.5px solid #ddd', padding: '4px 9px', fontSize: '11.5px' })} onClick={() => openEditEvent(ev)}>編集</button>
                          <button style={btn('#e74c3c', 'white', { padding: '4px 9px', fontSize: '11.5px' })} onClick={() => deleteEvent(ev.id)}>削除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 試合結果 */}
      {tab === 'matches' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
            <button style={btn('#2a2220', '#e8c84a')} onClick={openAddMatch}>＋ 試合結果入力</button>
          </div>
          <div style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '760px' }}>
                <thead>
                  <tr>{['日付','チーム','相手','スコア','種別','H/A','操作'].map(h => (
                    <th key={h} style={{ background: '#2a2220', color: '#e8c84a', padding: '9px 12px', textAlign: 'left', fontSize: '12px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {matches.length === 0 && <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#8a7f7a' }}>試合記録がありません</td></tr>}
                  {matches.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f0ebe5' }}>
                      <td style={{ padding: '9px 12px', color: '#8a7f7a', whiteSpace: 'nowrap' }}>{m.match_date}</td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{teamBadge(m.team)}</td>
                      <td style={{ padding: '9px 12px', fontWeight: '500', whiteSpace: 'nowrap' }}>{m.opponent}</td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: 'serif', fontSize: '16px', fontWeight: 'bold' }}>{m.score_us} - {m.score_them}</span>
                        <span style={{ marginLeft: '8px' }}>{resultTag(m)}</span>
                      </td>
                      <td style={{ padding: '9px 12px', color: '#8a7f7a', whiteSpace: 'nowrap' }}>{m.match_type}</td>
                      <td style={{ padding: '9px 12px', color: '#8a7f7a', whiteSpace: 'nowrap' }}>{m.home_away === 'home' ? '🏠 H' : m.home_away === 'away' ? '✈️ A' : '🏟️ N'}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button style={btn('transparent', '#2a2220', { border: '1.5px solid #ddd', padding: '4px 9px', fontSize: '11.5px' })} onClick={() => openEditMatch(m)}>編集</button>
                          <button style={btn('#e74c3c', 'white', { padding: '4px 9px', fontSize: '11.5px' })} onClick={() => deleteMatch(m.id)}>削除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 部費管理 */}
      {tab === 'payments' && <AdminPayments members={members} />}

      {/* 背番号管理 */}
      {tab === 'jersey' && (
        <div>
          {/* 凡例 */}
          <div style={{ display: 'flex', gap: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {[['#f0f0f0','#555','1px solid #ccc','ホーム（白）使用中'],['#d4f4e0','#1a7a40','none','アウェイ（緑）使用中'],['#faf8f5','#c8bfb8','1px dashed #c0b8b0','空き番号'],['#2a2220','#e8c84a','none','永久欠番']].map(([bg,color,border,label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#8a7f7a' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: bg, border }} />
                {label}
              </div>
            ))}
          </div>

          {/* ホームグリッド */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '2px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'inline-block', width: '11px', height: '22px', background: '#bbb', border: '1.5px solid #999', borderRadius: '3px' }} />
              ホームユニフォーム（白）
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: '9px' }}>
              {Array.from({ length: 99 }, (_, i) => i + 1).map(num => {
                const owner = members.find(m => m.jersey_home === num)
                const retired = RETIRED_NUMBERS.includes(num)
                return (
                  <div key={num}
                    style={{ background: retired ? '#2a2220' : (owner ? '#f0f0f0' : '#faf8f5'), borderRadius: '8px', padding: '9px 5px 7px', textAlign: 'center', border: retired ? '2px solid #2a2220' : (owner ? '2px solid #999' : '2px dashed #c0b8b0'), cursor: retired ? 'not-allowed' : 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: 'all .15s' }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '24px', lineHeight: 1, color: retired ? '#e8c84a' : (owner ? '#555' : '#c8bfb8') }}>{num}</div>
                    <div style={{ fontSize: '8.5px', color: retired ? 'rgba(255,255,255,0.55)' : '#8a7f7a', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{retired ? '－' : (owner ? owner.name : '－')}</div>
                    <div style={{ fontSize: '7.5px', fontWeight: '700', marginTop: '2px', color: retired ? '#e8c84a' : (owner ? '#888' : '#c8bfb8') }}>{retired ? '永久欠番' : (owner ? '使用中' : 'OPEN')}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* アウェイグリッド */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '2px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'inline-block', width: '11px', height: '22px', background: '#27ae60', borderRadius: '3px' }} />
              アウェイユニフォーム（緑）
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: '9px' }}>
              {Array.from({ length: 99 }, (_, i) => i + 1).map(num => {
                const owner = members.find(m => m.jersey_away === num)
                const retired = RETIRED_NUMBERS.includes(num)
                return (
                  <div key={num}
                    style={{ background: retired ? '#2a2220' : (owner ? '#d4f4e0' : '#faf8f5'), borderRadius: '8px', padding: '9px 5px 7px', textAlign: 'center', border: retired ? '2px solid #2a2220' : (owner ? '2px solid #27ae60' : '2px dashed #c0b8b0'), cursor: retired ? 'not-allowed' : 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: 'all .15s' }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '24px', lineHeight: 1, color: retired ? '#e8c84a' : (owner ? '#1a7a40' : '#c8bfb8') }}>{num}</div>
                    <div style={{ fontSize: '8.5px', color: retired ? 'rgba(255,255,255,0.55)' : '#8a7f7a', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{retired ? '－' : (owner ? owner.name : '－')}</div>
                    <div style={{ fontSize: '7.5px', fontWeight: '700', marginTop: '2px', color: retired ? '#e8c84a' : (owner ? '#1a7a40' : '#c8bfb8') }}>{retired ? '永久欠番' : (owner ? '使用中' : 'OPEN')}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 割当一覧テーブル */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '1.5px', marginBottom: '12px' }}>📋 割当一覧</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '560px' }}>
                <thead>
                  <tr>{['名前','チーム','Home #','Away #','操作'].map(h => (
                    <th key={h} style={{ background: '#2a2220', color: '#e8c84a', padding: '9px 12px', textAlign: 'left', fontSize: '12px', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f0ebe5' }}>
                      <td style={{ padding: '9px 12px', fontWeight: '500', whiteSpace: 'nowrap' }}>{m.name}</td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{teamBadge(m.team)}</td>
                      <td style={{ padding: '9px 12px' }}>{m.jersey_home ? <span style={{ background: '#f0f0f0', color: '#555', fontSize: '12px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', border: '1px solid #ccc' }}>#{m.jersey_home}</span> : '－'}</td>
                      <td style={{ padding: '9px 12px' }}>{m.jersey_away ? <span style={{ background: '#d4f4e0', color: '#1a7a40', fontSize: '12px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>#{m.jersey_away}</span> : '－'}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <button style={btn('transparent', '#2a2220', { border: '1.5px solid #ddd', padding: '4px 9px', fontSize: '11.5px' })} onClick={() => openEditMember(m)}>変更</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 協賛管理 */}
      {tab === 'sponsors' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
            <button style={btn('#2a2220', '#e8c84a')} onClick={openAddSponsor}>＋ スポンサー追加</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
            {sponsors.length === 0 && <div style={{ color: '#8a7f7a', fontSize: '13px' }}>スポンサーはありません</div>}
            {sponsors.map(sp => (
              <div key={sp.id} style={{ background: 'white', borderRadius: '10px', padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderLeft: `4px solid ${sp.category === 'gold' ? '#e8c84a' : sp.category === 'silver' ? '#888' : '#2a5fa5'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{sp.name}</div>
                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px', background: sp.category === 'gold' ? '#fef9e7' : sp.category === 'silver' ? '#f5f5f5' : '#dceeff', color: sp.category === 'gold' ? '#e8c84a' : sp.category === 'silver' ? '#888' : '#2a5fa5' }}>
                      {sp.category === 'gold' ? 'GOLD' : sp.category === 'silver' ? 'SILVER' : 'サポーター'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 7px', borderRadius: '4px', background: sp.is_active ? '#d4f4e0' : '#fff3cd', color: sp.is_active ? '#1a7a40' : '#856404' }}>
                    {sp.is_active ? '公開中' : '非公開'}
                  </span>
                </div>
                {sp.description && <div style={{ fontSize: '12px', color: '#8a7f7a', marginBottom: '8px' }}>{sp.description.slice(0, 50)}{sp.description.length > 50 ? '...' : ''}</div>}
                <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                  <button style={btn('transparent', '#2a2220', { border: '1.5px solid #ddd', padding: '4px 9px', fontSize: '11.5px' })} onClick={() => openEditSponsor(sp)}>編集</button>
                  <button style={btn('#e74c3c', 'white', { padding: '4px 9px', fontSize: '11.5px' })} onClick={() => deleteSponsor(sp.id)}>削除</button>
                </div>
              </div>
            ))}
          </div>

          {/* スポンサーモーダル */}
          {sponsorModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={() => setSponsorModal(false)}>
              <div style={{ background: 'white', borderRadius: '12px', padding: '26px', width: '520px', maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '19px', letterSpacing: '1px', marginBottom: '16px' }}>
                  {editSponsor ? '✏️ スポンサー編集' : '🤝 スポンサー追加'}
                </div>
                <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={labelStyle}>企業名・店名 *</label>
                    <input style={inputStyle} value={sponsorForm.name} onChange={e => setSponsorForm({ ...sponsorForm, name: e.target.value })} placeholder="例：田中商事" />
                  </div>
                  <div>
                    <label style={labelStyle}>カテゴリー</label>
                    <select style={inputStyle} value={sponsorForm.category} onChange={e => setSponsorForm({ ...sponsorForm, category: e.target.value })}>
                      <option value="gold">GOLD</option>
                      <option value="silver">SILVER</option>
                      <option value="general">サポーター</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>表示順</label>
                    <input style={inputStyle} type="number" value={sponsorForm.sort_order} onChange={e => setSponsorForm({ ...sponsorForm, sort_order: parseInt(e.target.value) })} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={labelStyle}>説明</label>
                    <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={sponsorForm.description} onChange={e => setSponsorForm({ ...sponsorForm, description: e.target.value })} placeholder="企業・お店の紹介文" />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={labelStyle}>🎁 SJFC会員特典</label>
                    <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} value={sponsorForm.benefits} onChange={e => setSponsorForm({ ...sponsorForm, benefits: e.target.value })} placeholder="例：ランチ10%割引、ドリンク1杯無料" />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={labelStyle}>住所</label>
                    <input style={inputStyle} value={sponsorForm.address} onChange={e => setSponsorForm({ ...sponsorForm, address: e.target.value })} placeholder="例：District 1, Ho Chi Minh City" />
                  </div>
                  <div>
                    <label style={labelStyle}>電話番号</label>
                    <input style={inputStyle} value={sponsorForm.phone} onChange={e => setSponsorForm({ ...sponsorForm, phone: e.target.value })} placeholder="例：028-xxxx-xxxx" />
                  </div>
                  <div>
                    <label style={labelStyle}>ウェブサイト</label>
                    <input style={inputStyle} value={sponsorForm.website_url} onChange={e => setSponsorForm({ ...sponsorForm, website_url: e.target.value })} placeholder="https://..." />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={labelStyle}>ロゴ画像（任意）</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      {sponsorForm.logo_url && (
                        <img src={sponsorForm.logo_url} alt="ロゴプレビュー" style={{ width: '56px', height: '56px', objectFit: 'contain', background: '#f5f2ee', borderRadius: '6px', border: '1px solid #e0dbd5' }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <input type="file" accept="image/*" onChange={e => uploadSponsorLogo(e.target.files?.[0])} disabled={logoUploading}
                          style={{ fontSize: '12.5px', width: '100%' }} />
                        {logoUploading && <div style={{ fontSize: '11.5px', color: '#8a7f7a', marginTop: '4px' }}>アップロード中...</div>}
                        {logoUploadError && <div style={{ fontSize: '11.5px', color: '#e74c3c', marginTop: '4px' }}>{logoUploadError}</div>}
                      </div>
                    </div>
                    <input style={inputStyle} value={sponsorForm.logo_url} onChange={e => setSponsorForm({ ...sponsorForm, logo_url: e.target.value })} placeholder="画像を選ぶと自動入力されます（直接URLを貼ってもOK）" />
                  </div>
                  <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" id="is_active" checked={sponsorForm.is_active} onChange={e => setSponsorForm({ ...sponsorForm, is_active: e.target.checked })} />
                    <label htmlFor="is_active" style={{ fontSize: '13px', cursor: 'pointer' }}>公開する</label>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '9px', justifyContent: 'flex-end' }}>
                  <button style={btn('transparent', '#2a2220', { border: '1.5px solid #ddd' })} onClick={() => setSponsorModal(false)}>キャンセル</button>
                  <button style={btn('#e8c84a', '#2a2220')} onClick={saveSponsor}>{editSponsor ? '保存する' : '追加する'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 体制図 */}
      {tab === 'orgchart' && (
        <div>
          {[['club', '🏛️ 本部'], ['u40', '🟣 U-40'], ['o40', '🔵 O-40']].map(([sectionKey, sectionLabel]) => (
            <div key={sectionKey} style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', letterSpacing: '1px', color: '#2a2220' }}>{sectionLabel}</div>
                <button style={btn('#2a2220', '#e8c84a', { padding: '4px 10px', fontSize: '11.5px' })} onClick={() => openAddOrg(sectionKey)}>＋ 役職追加</button>
              </div>
              {orgChart.filter(o => o.section === sectionKey).length === 0 && (
                <div style={{ color: '#8a7f7a', fontSize: '13px' }}>役職の登録がありません</div>
              )}
              {orgChart.filter(o => o.section === sectionKey).map(o => {
                const memberNames = (o.member_ids || []).map(id => members.find(m => m.id === id)?.name).filter(Boolean)
                const extraNames = o.names ? o.names.split(/[、,]/).map(s => s.trim()).filter(Boolean) : []
                const allNames = [...memberNames, ...extraNames]
                return (
                  <div key={o.id} style={{ background: 'white', borderRadius: '8px', padding: '10px 16px', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline', minWidth: 0 }}>
                      <span style={{ fontWeight: '700', fontSize: '13px', flexShrink: 0 }}>{o.role_title}</span>
                      <span style={{ fontSize: '13px', color: '#555' }}>{allNames.length > 0 ? allNames.join('、') : '（未定）'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button style={btn('transparent', '#2a2220', { border: '1.5px solid #ddd', padding: '4px 9px', fontSize: '11.5px' })} onClick={() => openEditOrg(o)}>編集</button>
                      <button style={btn('#e74c3c', 'white', { padding: '4px 9px', fontSize: '11.5px' })} onClick={() => deleteOrg(o.id)}>削除</button>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {/* 体制図モーダル */}
          {orgModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={() => setOrgModal(false)}>
              <div style={{ background: 'white', borderRadius: '12px', padding: '26px', width: '440px', maxWidth: '92vw', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '19px', letterSpacing: '1px', marginBottom: '16px' }}>
                  {editOrg ? '✏️ 役職編集' : '🧑‍🤝‍🧑 役職追加'}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={labelStyle}>区分</label>
                  <select style={inputStyle} value={orgForm.section} onChange={e => setOrgForm({ ...orgForm, section: e.target.value })}>
                    <option value="club">本部</option>
                    <option value="u40">U-40</option>
                    <option value="o40">O-40</option>
                  </select>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={labelStyle}>役職名 *</label>
                  <input style={inputStyle} value={orgForm.role_title} onChange={e => setOrgForm({ ...orgForm, role_title: e.target.value })} placeholder="例：キャプテン" />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={labelStyle}>選手から選択（複数選択可）</label>
                  <input style={{ ...inputStyle, marginBottom: '6px' }} value={orgMemberSearch} onChange={e => setOrgMemberSearch(e.target.value)} placeholder="名前で検索" />
                  <div style={{ border: '1.5px solid #e0dbd5', borderRadius: '6px', maxHeight: '190px', overflowY: 'auto', padding: '4px 10px' }}>
                    {members
                      .filter(m => !orgMemberSearch || m.name?.includes(orgMemberSearch))
                      .sort((a, b) => (a.team || '').localeCompare(b.team || '') || (a.name || '').localeCompare(b.name || ''))
                      .map(m => (
                        <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '12.5px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={orgForm.member_ids.includes(m.id)} onChange={() => toggleOrgMember(m.id)} />
                          <span>{m.name}</span>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: m.team === 'u40' ? '#7b5ea7' : '#2a5fa5' }}>{m.team === 'u40' ? 'U-40' : 'O-40'}</span>
                        </label>
                      ))}
                    {members.length === 0 && <div style={{ color: '#8a7f7a', fontSize: '12px', padding: '6px 0' }}>メンバーがいません</div>}
                  </div>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={labelStyle}>登録外の方（任意・自由入力、「、」区切り）</label>
                  <input style={inputStyle} value={orgForm.names} onChange={e => setOrgForm({ ...orgForm, names: e.target.value })} placeholder="アプリに未登録の方がいる場合のみ入力" />
                </div>
                <div style={{ marginBottom: '18px' }}>
                  <label style={labelStyle}>表示順</label>
                  <input style={inputStyle} type="number" value={orgForm.sort_order} onChange={e => setOrgForm({ ...orgForm, sort_order: parseInt(e.target.value) || 0 })} />
                </div>
                <div style={{ display: 'flex', gap: '9px', justifyContent: 'flex-end' }}>
                  <button style={btn('transparent', '#2a2220', { border: '1.5px solid #ddd' })} onClick={() => setOrgModal(false)}>キャンセル</button>
                  <button style={btn('#e8c84a', '#2a2220')} onClick={saveOrg}>{editOrg ? '保存する' : '追加する'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* マスタ設定 */}
      {tab === 'master' && (
        <div className="grid-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '18px' }}>
          <MasterSection category="event_type" title="📋 種別マスタ" />
          <MasterSection category="venue" title="📍 場所マスタ" />
          <MasterSection category="meetup_place" title="🚩 集合場所マスタ" />
        </div>
      )}

      {/* 会計（出納帳） */}
      {tab === 'accounting' && (
        <div>
          <div style={{ background: '#2a2220', borderRadius: '10px', padding: '18px 22px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.6)' }}>4財布合計残高</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '26px', letterSpacing: '1px', color: '#e8c84a' }}>{fmtVND(totalBalance())}</div>
          </div>

          {/* 会計担当者の管理（芦田のみ操作可） */}
          {isTreasurerAdmin && (
            <div style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: '20px', border: '1.5px solid #e8c84a' }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#2a2220', marginBottom: '4px' }}>🔑 会計担当者の管理</div>
              <div style={{ fontSize: '11.5px', color: '#8a7f7a', marginBottom: '12px' }}>会計タブへのアクセス権限を付与・解除できます（対象は既に管理者権限を持つメンバー。新しい方をまだ管理者にしていない場合は先に管理者権限の付与が必要です）</div>
              {members.filter(m => m.role === 'admin').map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0ebe5', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{m.name}</span>
                    {teamBadge(m.team)}
                    {m.is_treasurer && <span style={{ background: '#fff3cd', color: '#856404', fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '3px' }}>会計担当</span>}
                  </div>
                  {m.is_treasurer ? (
                    <button style={btn('#e74c3c', 'white', { padding: '4px 10px', fontSize: '11.5px' })} onClick={() => toggleTreasurer(m.id, false)}>権限を外す</button>
                  ) : (
                    <button style={btn('#e8c84a', '#2a2220', { padding: '4px 10px', fontSize: '11.5px' })} onClick={() => toggleTreasurer(m.id, true)}>権限を付与</button>
                  )}
                </div>
              ))}
              {members.filter(m => m.role === 'admin').length === 0 && <div style={{ color: '#8a7f7a', fontSize: '12px' }}>管理者権限を持つメンバーがいません</div>}
            </div>
          )}

          {/* 財布一覧 */}
          <div className="grid-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
            {wallets.map(w => (
              <div key={w.id} style={{ background: 'white', borderRadius: '10px', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#8a7f7a', marginBottom: '4px' }}>財布{w.code}</div>
                {editingHolderId === w.id ? (
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    <input style={{ ...inputStyle, padding: '4px 6px', fontSize: '12px' }} value={holderNameInput}
                      onChange={e => setHolderNameInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveHolderName(w.id)} autoFocus />
                    <button style={btn('#e8c84a', '#2a2220', { padding: '3px 8px', fontSize: '11px' })} onClick={() => saveHolderName(w.id)}>✓</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#2a2220' }}>{w.holder_name}</div>
                    <span style={{ fontSize: '10.5px', color: '#8a7f7a', cursor: 'pointer' }} onClick={() => openHolderEdit(w)}>✏️</span>
                  </div>
                )}
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', color: '#2a2220' }}>{fmtVND(walletBalance(w.id))}</div>
              </div>
            ))}
            {wallets.length === 0 && <div style={{ color: '#8a7f7a', fontSize: '13px' }}>財布データがありません</div>}
          </div>

          {/* 記帳フォーム */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#2a2220', marginBottom: '12px' }}>✏️ 新規記帳</div>
            <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={labelStyle}>財布 *</label>
                <select style={inputStyle} value={txForm.wallet_id} onChange={e => setTxForm({ ...txForm, wallet_id: e.target.value })}>
                  <option value="">選択してください</option>
                  {wallets.map(w => <option key={w.id} value={w.id}>財布{w.code}（{w.holder_name}）</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>日付 *</label>
                <input style={inputStyle} type="date" value={txForm.date} onChange={e => setTxForm({ ...txForm, date: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>種別</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={btn(txForm.type === 'income' ? '#1a7a40' : '#f0ebe5', txForm.type === 'income' ? 'white' : '#8a7f7a', { flex: 1, padding: '9px' })}
                    onClick={() => setTxForm({ ...txForm, type: 'income', category: '部費', customCategory: '' })}>収入</button>
                  <button style={btn(txForm.type === 'expense' ? '#c0392b' : '#f0ebe5', txForm.type === 'expense' ? 'white' : '#8a7f7a', { flex: 1, padding: '9px' })}
                    onClick={() => setTxForm({ ...txForm, type: 'expense', category: 'グランド代', customCategory: '' })}>支出</button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>カテゴリー</label>
                <select style={inputStyle} value={txForm.category} onChange={e => setTxForm({ ...txForm, category: e.target.value })}>
                  {(txForm.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {txForm.category === 'その他（自由入力）' && (
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>カテゴリー名（自由入力）</label>
                  <input style={inputStyle} value={txForm.customCategory} onChange={e => setTxForm({ ...txForm, customCategory: e.target.value })} placeholder="例：懇親会費" />
                </div>
              )}
              <div>
                <label style={labelStyle}>金額（VND） *</label>
                <input style={inputStyle} type="number" value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })} placeholder="例：500000" />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>メモ</label>
                <input style={inputStyle} value={txForm.memo} onChange={e => setTxForm({ ...txForm, memo: e.target.value })} placeholder="例：8月分部費（田中・山本）" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button style={btn('#e8c84a', '#2a2220', { padding: '10px 24px', fontWeight: '700' })} onClick={saveTransaction}>＋ 記帳する</button>
            </div>
          </div>

          {/* 取引履歴 */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#2a2220' }}>📖 取引履歴</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span onClick={() => setTxWalletFilter('all')} style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', border: '1.5px solid', borderColor: txWalletFilter === 'all' ? '#e8c84a' : '#ccc', background: txWalletFilter === 'all' ? '#2a2220' : 'transparent', color: txWalletFilter === 'all' ? '#e8c84a' : '#8a7f7a' }}>全て</span>
                {wallets.map(w => (
                  <span key={w.id} onClick={() => setTxWalletFilter(w.id)} style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', border: '1.5px solid', borderColor: txWalletFilter === w.id ? '#e8c84a' : '#ccc', background: txWalletFilter === w.id ? '#2a2220' : 'transparent', color: txWalletFilter === w.id ? '#e8c84a' : '#8a7f7a' }}>財布{w.code}</span>
                ))}
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '640px' }}>
                <thead>
                  <tr>{['日付','財布','種別','カテゴリー','金額','メモ','操作'].map(h => (
                    <th key={h} style={{ background: '#2a2220', color: '#e8c84a', padding: '9px 12px', textAlign: 'left', fontSize: '12px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {transactions.filter(t => txWalletFilter === 'all' || t.wallet_id === txWalletFilter).length === 0 && (
                    <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#8a7f7a' }}>取引記録がありません</td></tr>
                  )}
                  {transactions.filter(t => txWalletFilter === 'all' || t.wallet_id === txWalletFilter).map(t => {
                    const w = wallets.find(w => w.id === t.wallet_id)
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f0ebe5' }}>
                        <td style={{ padding: '9px 12px', color: '#8a7f7a', whiteSpace: 'nowrap' }}>{t.date}</td>
                        <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>財布{w?.code || '?'}（{w?.holder_name || '－'}）</td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ background: t.type === 'income' ? '#d4f4e0' : '#fde8e6', color: t.type === 'income' ? '#1a7a40' : '#c0392b', fontSize: '10.5px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px' }}>
                            {t.type === 'income' ? '収入' : '支出'}
                          </span>
                        </td>
                        <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{t.category}</td>
                        <td style={{ padding: '9px 12px', fontWeight: '600', whiteSpace: 'nowrap', color: t.type === 'income' ? '#1a7a40' : '#c0392b' }}>{t.type === 'income' ? '+' : '－'}{fmtVND(t.amount)}</td>
                        <td style={{ padding: '9px 12px', color: '#8a7f7a' }}>{t.memo || '－'}</td>
                        <td style={{ padding: '9px 12px' }}>
                          <button style={btn('#e74c3c', 'white', { padding: '4px 9px', fontSize: '11.5px' })} onClick={() => deleteTransaction(t.id)}>削除</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* メンバーモーダル */}
      {memberModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={() => setMemberModal(false)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '26px', width: '480px', maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>{editMember ? '✏️ メンバー編集' : '👥 メンバー追加'}</div>
            <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div><label style={labelStyle}>氏名 *</label><input style={inputStyle} value={memberForm.name} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })} placeholder="例：田中 健太" /></div>
              <div><label style={labelStyle}>ローマ字氏名</label><input style={inputStyle} value={memberForm.name_romaji} onChange={e => setMemberForm({ ...memberForm, name_romaji: e.target.value })} placeholder="例：Tanaka Kenta" /></div>
              <div><label style={labelStyle}>メインチーム</label><select style={inputStyle} value={memberForm.team} onChange={e => setMemberForm({ ...memberForm, team: e.target.value })}><option value="u40">U-40</option><option value="o40">O-40</option></select></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '18px' }}>
                <input type="checkbox" id="dual_team_check" checked={!!memberForm.dual_team} onChange={e => setMemberForm({ ...memberForm, dual_team: e.target.checked })} />
                <label htmlFor="dual_team_check" style={{ fontSize: '12.5px', color: '#2a2220', cursor: 'pointer' }}>U-40/O-40 兼務（両チームの試合で得点・アシスト選手として選択可）</label>
              </div>
              <div><label style={labelStyle}>ポジション１</label><select style={inputStyle} value={memberForm.position1} onChange={e => setMemberForm({ ...memberForm, position1: e.target.value })}>{['GK','DF','MF','FW'].map(p => <option key={p}>{p}</option>)}</select></div>
              <div><label style={labelStyle}>ポジション２（任意）</label><select style={inputStyle} value={memberForm.position2} onChange={e => setMemberForm({ ...memberForm, position2: e.target.value })}><option value="">－</option>{['GK','DF','MF','FW'].map(p => <option key={p}>{p}</option>)}</select></div>
              <div><label style={labelStyle}>生年</label><input style={inputStyle} type="number" value={memberForm.birth_year} onChange={e => setMemberForm({ ...memberForm, birth_year: e.target.value })} placeholder="例：1990" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div><label style={labelStyle}>誕生月</label>
                  <select style={inputStyle} value={memberForm.birth_month} onChange={e => setMemberForm({ ...memberForm, birth_month: e.target.value })}>
                    <option value="">－</option>
                    {Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1}月</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>誕生日</label>
                  <select style={inputStyle} value={memberForm.birth_day} onChange={e => setMemberForm({ ...memberForm, birth_day: e.target.value })}>
                    <option value="">－</option>
                    {Array.from({length:31},(_,i)=><option key={i+1} value={i+1}>{i+1}日</option>)}
                  </select>
                </div>
              </div>
              <div><label style={labelStyle}>入部年月</label><input style={inputStyle} type="month" value={memberForm.joined_at?.slice(0,7) || ''} onChange={e => setMemberForm({ ...memberForm, joined_at: e.target.value + '-01' })} /></div>
              <div><label style={labelStyle}>Home 背番号</label><input style={inputStyle} type="number" value={memberForm.jersey_home} onChange={e => setMemberForm({ ...memberForm, jersey_home: e.target.value })} /></div>
              <div><label style={labelStyle}>Away 背番号</label><input style={inputStyle} type="number" value={memberForm.jersey_away} onChange={e => setMemberForm({ ...memberForm, jersey_away: e.target.value })} /></div>
              <div><label style={labelStyle}>支払区分</label><select style={inputStyle} value={memberForm.dues_type} onChange={e => setMemberForm({ ...memberForm, dues_type: e.target.value })}><option value="monthly">月額払い</option><option value="spot">都度払い</option></select></div>
              <div><label style={labelStyle}>ステータス</label><select style={inputStyle} value={memberForm.status} onChange={e => setMemberForm({ ...memberForm, status: e.target.value })}><option value="active">在籍</option><option value="inactive">休止中</option></select></div>
            </div>
            {!editMember && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px', padding: '14px', background: '#f8f5f0', borderRadius: '8px' }}>
                <div style={{ gridColumn: '1/-1', fontSize: '12px', color: '#8a7f7a' }}>ログイン情報（新規追加時のみ）</div>
                <div><label style={labelStyle}>メールアドレス *</label><input style={inputStyle} type="email" value={memberForm.email} onChange={e => setMemberForm({ ...memberForm, email: e.target.value })} placeholder="email@example.com" /></div>
                <div><label style={labelStyle}>パスワード *</label><input style={inputStyle} type="password" value={memberForm.password} onChange={e => setMemberForm({ ...memberForm, password: e.target.value })} placeholder="8文字以上" /></div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '9px', justifyContent: 'flex-end' }}>
              <button style={btn('transparent', '#2a2220', { border: '1.5px solid #ddd' })} onClick={() => setMemberModal(false)}>キャンセル</button>
              <button style={btn('#e8c84a', '#2a2220')} onClick={saveMember}>{editMember ? '保存する' : '追加する'}</button>
            </div>
          </div>
        </div>
      )}

      {/* イベントモーダル */}
      {eventModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={() => setEventModal(false)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '26px', width: '520px', maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>{editEvent ? '✏️ イベント編集' : '📅 イベント追加'}</div>
            <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>タイトル *</label><input style={inputStyle} value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} placeholder="例：通常練習" /></div>
              <div><label style={labelStyle}>カテゴリー</label><select style={inputStyle} value={eventForm.category} onChange={e => setEventForm({ ...eventForm, category: e.target.value })}><option value="u40">U-40</option><option value="o40">O-40</option><option value="joint">合同</option></select></div>
              <div><label style={labelStyle}>種別</label><select style={inputStyle} value={eventForm.event_type} onChange={e => setEventForm({ ...eventForm, event_type: e.target.value })}><option value="">選択</option>{masters.event_type.map(m => <option key={m.id} value={m.value}>{m.value}</option>)}</select></div>
              <div><label style={labelStyle}>日付 *</label><input style={inputStyle} type="date" min={new Date().toISOString().split('T')[0]} value={eventForm.event_date} onChange={e => setEventForm({ ...eventForm, event_date: e.target.value, deadline: '' })} /></div>
              <div><label style={labelStyle}>場所（会場）</label><select style={inputStyle} value={eventForm.venue} onChange={e => setEventForm({ ...eventForm, venue: e.target.value })}><option value="">選択</option>{masters.venue.map(m => <option key={m.id} value={m.value}>{m.value}</option>)}</select></div>
              <div><label style={labelStyle}>開始時間／キックオフ</label><TimeInput value={eventForm.kickoff_time} onChange={v => setEventForm({ ...eventForm, kickoff_time: v })} /></div>
              <div><label style={labelStyle}>終了時間</label><TimeInput value={eventForm.end_time || ''} onChange={v => setEventForm({ ...eventForm, end_time: v })} /></div>
              <div><label style={labelStyle}>集合場所</label><select style={inputStyle} value={eventForm.meetup_place} onChange={e => setEventForm({ ...eventForm, meetup_place: e.target.value })}><option value="">選択</option>{masters.meetup_place.map(m => <option key={m.id} value={m.value}>{m.value}</option>)}</select></div>
              <div><label style={labelStyle}>集合時間</label><TimeInput value={eventForm.meetup_time} onChange={v => setEventForm({ ...eventForm, meetup_time: v })} /></div>
              <div><label style={labelStyle}>出欠締め切り</label><input style={inputStyle} type="date"
                min={new Date().toISOString().split('T')[0]}
                max={eventForm.event_date || ''}
                value={eventForm.deadline}
                onChange={e => setEventForm({ ...eventForm, deadline: e.target.value })}
                disabled={!eventForm.event_date}
              /></div>
              <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>備考</label><input style={inputStyle} value={eventForm.notes} onChange={e => setEventForm({ ...eventForm, notes: e.target.value })} placeholder="例：雨天中止あり" /></div>
            </div>
            <div style={{ display: 'flex', gap: '9px', justifyContent: 'flex-end' }}>
              <button style={btn('transparent', '#2a2220', { border: '1.5px solid #ddd' })} onClick={() => setEventModal(false)}>キャンセル</button>
              <button style={btn('#e8c84a', '#2a2220')} onClick={saveEvent}>{editEvent ? '保存する' : '追加する'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 試合結果モーダル */}
      {matchModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={() => setMatchModal(false)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '26px', width: '520px', maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>{editMatch ? '✏️ 試合結果編集' : '🏆 試合結果入力'}</div>

            {/* スケジュールから選択 */}
            <div style={{ marginBottom: '14px', padding: '12px 14px', background: '#f8f5f0', borderRadius: '8px' }}>
              <label style={labelStyle}>📅 スケジュールから試合を選択（任意）</label>
              <select style={inputStyle} value={matchForm.event_id} onChange={e => onSelectEvent(e.target.value)}>
                <option value="">スケジュールから選択しない</option>
                {matchEvents.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.event_date} / {ev.title} / {ev.event_type}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '11px', color: '#8a7f7a', marginTop: '4px' }}>選択すると日付・会場・種別が自動入力されます</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div><label style={labelStyle}>チーム</label><select style={inputStyle} value={matchForm.team} onChange={e => setMatchForm({ ...matchForm, team: e.target.value })}><option value="u40">U-40</option><option value="o40">O-40</option></select></div>
              <div><label style={labelStyle}>日付 *</label><input style={inputStyle} type="date" value={matchForm.match_date} onChange={e => setMatchForm({ ...matchForm, match_date: e.target.value })} /></div>
              <div><label style={labelStyle}>相手チーム *</label><input style={inputStyle} value={matchForm.opponent} onChange={e => setMatchForm({ ...matchForm, opponent: e.target.value })} placeholder="例：ハノイ日本人FC" /></div>
              <div><label style={labelStyle}>種別</label><select style={inputStyle} value={matchForm.match_type} onChange={e => setMatchForm({ ...matchForm, match_type: e.target.value })}>{['公式戦','フレンドリー','カップ戦','遠征'].map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label style={labelStyle}>H / A</label><select style={inputStyle} value={matchForm.home_away} onChange={e => setMatchForm({ ...matchForm, home_away: e.target.value })}><option value="home">👕 ホーム</option><option value="away">👕 アウェイ</option><option value="neutral">🏟️ 中立地</option></select></div>
              <div><label style={labelStyle}>会場</label><input style={inputStyle} value={matchForm.venue} onChange={e => setMatchForm({ ...matchForm, venue: e.target.value })} placeholder="例：Thong Nhat Stadium" /></div>
            </div>

            {/* スコア */}
            <div style={{ background: '#f8f5f0', borderRadius: '8px', padding: '16px', marginBottom: '14px' }}>
              <div style={{ textAlign: 'center', marginBottom: '12px', fontSize: '12px', color: '#8a7f7a', fontWeight: '600' }}>スコア</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#8a7f7a', marginBottom: '4px' }}>Saigon Japan FC</div>
                  <input type="number" min="0" value={matchForm.score_us} onChange={e => setMatchForm({ ...matchForm, score_us: e.target.value })}
                    style={{ width: '70px', padding: '8px', border: '1.5px solid #e0dbd5', borderRadius: '6px', fontSize: '28px', textAlign: 'center', fontFamily: 'serif' }} />
                </div>
                <div style={{ fontFamily: 'serif', fontSize: '28px', color: '#8a7f7a' }}>-</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#8a7f7a', marginBottom: '4px' }}>{matchForm.opponent || '相手チーム'}</div>
                  <input type="number" min="0" value={matchForm.score_them} onChange={e => setMatchForm({ ...matchForm, score_them: e.target.value })}
                    style={{ width: '70px', padding: '8px', border: '1.5px solid #e0dbd5', borderRadius: '6px', fontSize: '28px', textAlign: 'center', fontFamily: 'serif' }} />
                </div>
              </div>
            </div>

            {/* 得点者 */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={labelStyle}>⚽ 得点者</label>
                <button style={btn('#e8c84a', '#2a2220', { padding: '3px 10px', fontSize: '11px' })} onClick={addScorer}>＋ 追加</button>
              </div>
              {scorerInputs.map((s, i) => (
                <div key={i} style={{ border: '1px solid #e0dbd5', borderRadius: '6px', padding: '8px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <select style={{ ...inputStyle, flex: 2 }} value={s.member_id} onChange={e => updateScorer(i, 'member_id', e.target.value)}>
                      <option value="">選手を選択</option>
                      {scorerCandidates(matchForm.team).map(m => <option key={m.id} value={m.id}>{m.name}{m.team !== matchForm.team ? '（兼務）' : ''}</option>)}
                    </select>
                    <input style={{ ...inputStyle, width: '70px', flex: 'none' }} type="number" value={s.minute} onChange={e => updateScorer(i, 'minute', e.target.value)} placeholder="分" />
                    <button style={btn('#e74c3c', 'white', { padding: '4px 8px', fontSize: '11px', flex: 'none' })} onClick={() => removeScorer(i)}>✕</button>
                  </div>
                  <select style={inputStyle} value={s.assist_member_id} onChange={e => updateScorer(i, 'assist_member_id', e.target.value)}>
                    <option value="">🎯 アシストなし</option>
                    {scorerCandidates(matchForm.team).map(m => <option key={m.id} value={m.id}>{m.name}{m.team !== matchForm.team ? '（兼務）' : ''}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>備考</label>
              <input style={inputStyle} value={matchForm.notes} onChange={e => setMatchForm({ ...matchForm, notes: e.target.value })} placeholder="例：警告：田中" />
            </div>

            <div style={{ display: 'flex', gap: '9px', justifyContent: 'flex-end' }}>
              <button style={btn('transparent', '#2a2220', { border: '1.5px solid #ddd' })} onClick={() => setMatchModal(false)}>キャンセル</button>
              <button style={btn('#e8c84a', '#2a2220')} onClick={saveMatch}>{editMatch ? '保存する' : '登録する'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
