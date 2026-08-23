import { createClient } from '@supabase/supabase-js'

// 新規部員のログインアカウント作成（管理者のみ実行可）
// ブラウザ側の anon キーでは Supabase Auth の管理API（ユーザー作成）を呼び出せないため
// （"User not allowed" エラーの原因）、この処理はサーバー側の service_role キーで行う。
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: '認証情報がありません' })

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return res.status(500).json({ error: 'サーバー側の環境変数が設定されていません（SUPABASE_SERVICE_ROLE_KEYを確認してください）' })
  }

  // リクエストを送ってきた本人を、渡されたトークンで検証する
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser()
  if (callerError || !caller) return res.status(401).json({ error: '認証に失敗しました' })

  // service_role キーで動く管理用クライアント（サーバー側のみ・ブラウザには一切渡さない）
  const admin = createClient(supabaseUrl, serviceRoleKey)

  // 本人が管理者ロールを持っているかを確認
  const { data: callerProfile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()

  if (profileError || callerProfile?.role !== 'admin') {
    return res.status(403).json({ error: '管理者のみ実行できます' })
  }

  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ error: 'メールアドレスとパスワードは必須です' })
  }

  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError) {
    const msg = (createError.message || '').toLowerCase()
    const alreadyExists = msg.includes('already been registered') || msg.includes('already registered') || msg.includes('already exists')

    if (!alreadyExists) {
      return res.status(400).json({ error: createError.message })
    }

    // このメールアドレスの認証ユーザーは既に存在している（例：以前の操作でプロフィール保存だけ失敗した等）。
    // 新規作成ではなく、既存ユーザーを探して再利用する（プロフィール側は呼び出し元でupsertされる）
    let existingId = null
    for (let page = 1; page <= 20 && !existingId; page++) {
      const { data: listData, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 200 })
      if (listError || !listData?.users?.length) break
      const match = listData.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase())
      if (match) { existingId = match.id; break }
      if (listData.users.length < 200) break // 最終ページまで確認済み
    }

    if (!existingId) {
      return res.status(400).json({ error: 'このメールアドレスは既に登録済みですが、該当ユーザーが見つかりませんでした。Supabaseダッシュボードで確認してください。' })
    }

    // フォームで入力されたパスワードに合わせておく
    await admin.auth.admin.updateUserById(existingId, { password })

    return res.status(200).json({ id: existingId, reused: true })
  }

  return res.status(200).json({ id: newUser.user.id })
}
