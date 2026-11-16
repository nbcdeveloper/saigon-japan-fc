import { createClient } from '@supabase/supabase-js'

// 入部申請の受付（ログイン不要・誰でも送信可）
// ・入力チェックはここ（サーバー側）で必ず行う。ブラウザ側のチェックは親切のためだけ
// ・保存は service_role キーで行う（entry_applications は管理者しか読めないテーブル）
// ・スパム対策：ハニーポット項目 / 同一メールの重複申込の拒否 / 短時間の大量送信の制限

const CATEGORIES = ['U-40', 'O-40']
const POSITIONS = ['GK', 'DF', 'MF', 'FW']
const SIZES = ['M', 'L', 'LL', '3L']

const clean = (v, max) => {
  if (v === undefined || v === null) return ''
  return String(v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max)
}

const ageOn = (birth, today) => {
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'サーバー設定エラーです。お手数ですが幹部にご連絡ください。' })
  }

  const b = (typeof req.body === 'string' ? safeJson(req.body) : req.body) || {}

  // ハニーポット：人間には見えない欄。入っていたらボットなので、成功したふりをして捨てる
  if (b.website) return res.status(200).json({ ok: true })

  const category = clean(b.category, 10)
  const name = clean(b.name, 60)
  const nameKana = clean(b.name_kana, 60)
  const birthStr = clean(b.birth_date, 10)
  const nickname = clean(b.nickname, 40)
  const phone = clean(b.phone, 40)
  const email = clean(b.email, 120).toLowerCase()
  const address = clean(b.address, 200)
  const workplace = clean(b.workplace, 100)
  const hometown = clean(b.hometown, 40)
  const emergencyName = clean(b.emergency_name, 60)
  const emergencyRelation = clean(b.emergency_relation, 30)
  const emergencyPhone = clean(b.emergency_phone, 80)
  const joinPeriod = clean(b.join_period, 20)
  const returnPeriod = clean(b.return_period, 40)
  const position1 = clean(b.position1, 5)
  const position2 = clean(b.position2, 5)
  const uniformSize = clean(b.uniform_size, 5)
  const guardianName = clean(b.guardian_name, 60)
  const consentName = clean(b.consent_name, 60)

  // --- 必須・形式チェック ---
  if (!CATEGORIES.includes(category)) return bad(res, 'カテゴリーを選択してください')
  if (!name) return bad(res, '氏名を入力してください')
  if (!nameKana) return bad(res, 'フリガナを入力してください')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthStr)) return bad(res, '生年月日を入力してください')
  const birth = new Date(birthStr + 'T00:00:00')
  const today = new Date()
  if (Number.isNaN(birth.getTime()) || birth.getFullYear() < 1920 || birth > today) {
    return bad(res, '生年月日を確認してください')
  }
  if (!/^[0-9+\-\s()]{6,40}$/.test(phone)) return bad(res, 'ベトナムでの携帯番号を確認してください（数字・+・-のみ）')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 'メールアドレスを確認してください')
  if (!emergencyName) return bad(res, '緊急連絡先の氏名を入力してください')
  if (emergencyPhone.length < 6) return bad(res, '緊急連絡先の電話番号を入力してください')
  if (position1 && !POSITIONS.includes(position1)) return bad(res, 'ポジションを確認してください')
  if (position2 && !POSITIONS.includes(position2)) return bad(res, 'ポジションを確認してください')
  if (uniformSize && !SIZES.includes(uniformSize)) return bad(res, 'ユニフォームサイズを確認してください')
  if (ageOn(birth, today) < 19 && !guardianName) {
    return bad(res, '高校生以下の方は保護者の方のお名前が必要です')
  }
  if (b.consent !== true) return bad(res, '規則・方針への同意にチェックしてください')
  if (!consentName) return bad(res, '署名として氏名を入力してください')

  const db = createClient(supabaseUrl, serviceRoleKey)

  // --- スパム・二重送信対策 ---
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { count: recent, error: recentErr } = await db
    .from('entry_applications')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', tenMinAgo)
  if (recentErr) return res.status(500).json({ error: '保存に失敗しました。時間をおいてもう一度お試しください。' })
  if ((recent || 0) >= 15) {
    return res.status(429).json({ error: 'ただいま混み合っています。しばらくしてからもう一度お試しください。' })
  }

  const { count: dup } = await db
    .from('entry_applications')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .ilike('email', email)
  if ((dup || 0) > 0) {
    return res.status(409).json({ error: 'このメールアドレスの申込はすでに受け付けています。幹部からの連絡をお待ちください。' })
  }

  const { error: insertErr } = await db.from('entry_applications').insert({
    category,
    name,
    name_kana: nameKana,
    birth_date: birthStr,
    nickname: nickname || null,
    phone,
    email,
    address: address || null,
    workplace: workplace || null,
    hometown: hometown || null,
    emergency_name: emergencyName,
    emergency_relation: emergencyRelation || null,
    emergency_phone: emergencyPhone,
    join_period: joinPeriod || null,
    return_period: returnPeriod || null,
    position1: position1 || null,
    position2: position2 || null,
    uniform_size: uniformSize || null,
    guardian_name: guardianName || null,
    consent_name: consentName,
  })

  if (insertErr) {
    return res.status(500).json({ error: '保存に失敗しました。時間をおいてもう一度お試しください。' })
  }

  return res.status(200).json({ ok: true })
}

function bad(res, msg) {
  return res.status(400).json({ error: msg })
}

function safeJson(s) {
  try { return JSON.parse(s) } catch { return null }
}