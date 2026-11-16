import { createClient } from '@supabase/supabase-js'
import { randomInt } from 'crypto'

// 入部申請の承認（管理者のみ実行可）
// 1) 申請を確認 → 2) ログインアカウント作成（個別の仮パスワードを自動生成）
// 3) profiles に公開してよい項目だけ登録（電話・緊急連絡先は entry_applications に残す）
// 4) 申請を「承認済み」に更新（承認者・日時・部員番号を記録）
// 仮パスワードは、このレスポンスで一度だけ返す（DBには保存しない）

const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 紛らわしい文字(l,1,I,O,0)を除く

function makePassword() {
  const pick = () => ALPHABET[randomInt(ALPHABET.length)]
  for (;;) {
    const pw = Array.from({ length: 10 }, pick).join('')
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && /[0-9]/.test(pw)) return pw
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: '認証情報がありません' })

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return res.status(500).json({ error: 'サーバー側の環境変数が設定されていません' })
  }

  // 呼び出した本人をトークンで検証し、管理者かどうか確認する
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser()
  if (callerError || !caller) return res.status(401).json({ error: '認証に失敗しました' })

  const admin = createClient(supabaseUrl, serviceRoleKey)

  const { data: callerProfile, error: profileError } = await admin
    .from('profiles').select('role').eq('id', caller.id).single()
  if (profileError || callerProfile?.role !== 'admin') {
    return res.status(403).json({ error: '管理者のみ実行できます' })
  }

  const body = typeof req.body === 'string' ? safeJson(req.body) : req.body
  const { id, member_no: memberNoRaw } = body || {}
  const memberNo = Number(memberNoRaw)
  if (!id) return res.status(400).json({ error: '申請IDがありません' })
  if (!Number.isInteger(memberNo) || memberNo <= 0) {
    return res.status(400).json({ error: '部員番号は1以上の整数で指定してください' })
  }

  // --- 申請の確認 ---
  const { data: app, error: appErr } = await admin
    .from('entry_applications').select('*').eq('id', id).single()
  if (appErr || !app) return res.status(404).json({ error: '申請が見つかりません' })
  if (app.status !== 'pending') {
    return res.status(409).json({ error: 'この申請はすでに処理済みです（承認済みまたは却下）' })
  }

  // 部員番号の重複チェック
  const { data: taken } = await admin.from('profiles').select('id').eq('member_no', memberNo).limit(1)
  if (taken && taken.length) {
    return res.status(409).json({ error: `部員番号 ${memberNo} はすでに使われています。別の番号にしてください。` })
  }

  const email = String(app.email).toLowerCase()
  const password = makePassword()

  // --- ログインアカウント作成（すでにあれば再利用）---
  let userId = null
  let created = false
  let reused = false

  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  })

  if (createError) {
    const msg = (createError.message || '').toLowerCase()
    const exists = msg.includes('already been registered') || msg.includes('already registered') || msg.includes('already exists')
    if (!exists) return res.status(400).json({ error: 'アカウント作成に失敗しました：' + createError.message })

    // 同じメールのログインがすでにある：メンバー登録の有無を確認する
    let existingId = null
    for (let page = 1; page <= 20 && !existingId; page++) {
      const { data: listData, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 200 })
      if (listError || !listData?.users?.length) break
      const match = listData.users.find(u => (u.email || '').toLowerCase() === email)
      if (match) { existingId = match.id; break }
      if (listData.users.length < 200) break
    }
    if (!existingId) {
      return res.status(400).json({ error: 'このメールアドレスは登録済みですが、該当ユーザーが見つかりませんでした。Supabaseで確認してください。' })
    }

    const { data: existingProfile } = await admin
      .from('profiles').select('id, name, status').eq('id', existingId).maybeSingle()
    if (existingProfile) {
      const hint = existingProfile.status === 'left'
        ? '退会済みのメンバーです。管理者画面の「メンバー」から在籍に戻してください。'
        : 'すでにメンバーとして登録されています。申込メールアドレスを確認してください。'
      return res.status(409).json({ error: `このメールアドレスは「${existingProfile.name || '既存メンバー'}」さんとして登録済みです。${hint}` })
    }

    // ログインだけ残っていてメンバー登録がない場合のみ再利用（パスワードを新しく設定）
    const { error: updErr } = await admin.auth.admin.updateUserById(existingId, { password })
    if (updErr) return res.status(400).json({ error: 'パスワード設定に失敗しました：' + updErr.message })
    userId = existingId
    reused = true
  } else {
    userId = newUser.user.id
    created = true
  }

  // --- profiles に登録（管理者画面の「メンバー追加」と同じ項目構成）---
  const birth = String(app.birth_date || '').split('-').map(Number) // [年, 月, 日]
  const joinedAt = /^\d{4}-\d{2}$/.test(app.join_period || '')
    ? `${app.join_period}-01`
    : `${new Date().toISOString().slice(0, 7)}-01`

  const profileData = {
    id: userId,
    name: app.name,
    name_kana: app.name_kana || null,
    team: app.category === 'U-40' ? 'u40' : 'o40',
    position1: app.position1 || 'MF',
    position2: app.position2 || null,
    birth_year: birth[0] || null,
    birth_month: birth[1] || null,
    birth_day: birth[2] || null,
    joined_at: joinedAt,
    status: 'active',
    dues_type: 'monthly',
    role: 'member',
    dual_team: false,
    member_no: memberNo,
  }

  // 認証ユーザー作成時にトリガーで profiles 行が先にできる場合があるため upsert
  const { error: upsertErr } = await admin.from('profiles').upsert(profileData)
  if (upsertErr) {
    // 作ったばかりのログインは巻き戻す（中途半端な状態を残さない）
    if (created) await admin.auth.admin.deleteUser(userId)
    return res.status(500).json({ error: 'メンバー登録に失敗しました：' + upsertErr.message })
  }

  // --- 申請を承認済みに更新（二重承認防止のため pending のものだけ）---
  const { error: doneErr } = await admin
    .from('entry_applications')
    .update({
      status: 'approved',
      approved_by: caller.id,
      approved_at: new Date().toISOString(),
      profile_id: userId,
      member_no: memberNo,
    })
    .eq('id', id)
    .eq('status', 'pending')

  if (doneErr) {
    // アカウントとメンバー登録は完了している。申請の状態更新だけ失敗した場合は、パスワードを返して知らせる
    return res.status(200).json({
      ok: true, email, password, member_no: memberNo, reused,
      warning: '申請の状態を更新できませんでした。管理者画面で状態を確認してください。',
    })
  }

  return res.status(200).json({ ok: true, email, password, member_no: memberNo, reused })
}

function safeJson(s) {
  try { return JSON.parse(s) } catch { return null }
}