import { useState } from 'react'

// 入部申込フォーム（ログイン不要の公開ページ：/entry）
// 送信先は /api/submit-entry（サーバー側で再チェックして保存）

const GOLD = '#e8c84a'
const BG = '#2a2220'
const CARD = '#362d2a'
const LINE = '#5a4d48'

const S = {
  page: { minHeight: '100vh', background: BG, color: '#f3ece6', padding: '24px 16px 64px', fontFamily: "'Noto Sans JP', system-ui, sans-serif" },
  wrap: { maxWidth: 640, margin: '0 auto' },
  title: { fontFamily: "'Bebas Neue', sans-serif", color: GOLD, fontSize: 30, letterSpacing: 2, margin: '0 0 4px' },
  sub: { color: '#cdbfb6', fontSize: 14, lineHeight: 1.7, margin: '0 0 20px' },
  card: { background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 16, marginBottom: 16 },
  h2: { color: GOLD, fontSize: 15, margin: '0 0 12px', fontWeight: 700 },
  label: { display: 'block', fontSize: 13, color: '#e6d9d0', margin: '12px 0 4px', fontWeight: 600 },
  req: { color: '#ff8a7a', marginLeft: 4, fontSize: 12 },
  hint: { fontSize: 12, color: '#b9aaa0', margin: '4px 0 0', lineHeight: 1.6 },
  input: { width: '100%', boxSizing: 'border-box', background: '#241c1a', color: '#f3ece6', border: `1px solid ${LINE}`, borderRadius: 8, padding: '10px 12px', fontSize: 16 },
  row: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  half: { flex: '1 1 200px', minWidth: 0 },
  btn: { width: '100%', background: GOLD, color: '#2a2220', border: 'none', borderRadius: 10, padding: '14px', fontSize: 16, fontWeight: 800, cursor: 'pointer' },
  err: { background: '#5a2a26', border: '1px solid #b34a40', color: '#ffd7d2', borderRadius: 8, padding: '10px 12px', fontSize: 14, margin: '0 0 14px', lineHeight: 1.6 },
  note: { background: '#2f3a2a', border: '1px solid #55703f', color: '#dcebd2', borderRadius: 8, padding: '10px 12px', fontSize: 13, margin: '10px 0 0', lineHeight: 1.6 },
}

const POSITIONS = ['GK', 'DF', 'MF', 'FW']
const SIZES = ['M', 'L', 'LL', '3L']

const ageOf = (str) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return null
  const b = new Date(str + 'T00:00:00')
  if (Number.isNaN(b.getTime())) return null
  const t = new Date()
  let a = t.getFullYear() - b.getFullYear()
  const m = t.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--
  return a
}

const initial = {
  category: '', name: '', name_kana: '', birth_date: '', nickname: '',
  phone: '', email: '', address: '', workplace: '', hometown: '',
  emergency_name: '', emergency_relation: '', emergency_phone: '',
  join_period: '', return_period: '', position1: '', position2: '', uniform_size: '',
  guardian_name: '', consent: false, consent_name: '', website: '',
}

// 部品はこのファイルのトップレベルで定義する（コンポーネントの中で定義すると入力のたびに作り直されてフォーカスが外れるため）
function Field({ label, required, hint, children }) {
  return (
    <div>
      <label style={S.label}>{label}{required && <span style={S.req}>必須</span>}</label>
      {children}
      {hint && <p style={S.hint}>{hint}</p>}
    </div>
  )
}

export default function EntryForm() {
  const [f, setF] = useState(initial)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))
  const age = ageOf(f.birth_date)
  const isMinor = age !== null && age < 19

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!f.category) return setError('カテゴリーを選択してください')
    if (isMinor && !f.guardian_name.trim()) return setError('高校生以下の方は保護者の方のお名前を入力してください')
    if (!f.consent) return setError('規則・方針への同意にチェックしてください')
    if (!f.consent_name.trim()) return setError('署名として氏名を入力してください')

    setSending(true)
    try {
      const res = await fetch('/api/submit-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error || '送信に失敗しました。時間をおいてもう一度お試しください。')
      } else {
        setDone(true)
        window.scrollTo({ top: 0 })
      }
    } catch {
      setError('通信に失敗しました。電波の良いところでもう一度お試しください。')
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div style={S.page}>
        <div style={S.wrap}>
          <h1 style={S.title}>SJFC ENTRY</h1>
          <div style={S.card}>
            <h2 style={S.h2}>申込を受け付けました</h2>
            <p style={{ ...S.sub, margin: 0 }}>
              ありがとうございます。幹部が内容を確認し、承認後にSJFCサイトのログイン情報をご連絡します。
              しばらくしても連絡がない場合は、お手数ですが幹部までお知らせください。
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <h1 style={S.title}>SJFC ENTRY</h1>
        <p style={S.sub}>
          Saigon Japan Football Club 入部申込フォーム。<br />
          入力内容はSJFCの運営のためだけに使用し、他の目的には使用しません（閲覧できるのは幹部のみです）。
        </p>

        <form onSubmit={submit}>
          {error && <div style={S.err}>{error}</div>}

          {/* ハニーポット：人間には見えない。ボットだけが入力する */}
          <div style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }} aria-hidden="true">
            <label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></label>
          </div>

          <div style={S.card}>
            <h2 style={S.h2}>① 基本情報</h2>

            <Field label="カテゴリー" required>
              <div style={S.row}>
                {['U-40', 'O-40'].map((c) => (
                  <label key={c} style={{ ...S.half, display: 'flex', alignItems: 'center', gap: 8, background: '#241c1a', border: `1px solid ${f.category === c ? GOLD : LINE}`, borderRadius: 8, padding: '10px 12px', fontSize: 16, cursor: 'pointer' }}>
                    <input type="radio" name="category" checked={f.category === c} onChange={() => setF((p) => ({ ...p, category: c }))} />
                    {c}
                  </label>
                ))}
              </div>
              <p style={S.hint}>O-50でのご参加を希望の方は、幹部にご連絡ください。</p>
            </Field>

            <div style={S.row}>
              <div style={S.half}>
                <Field label="氏名" required>
                  <input style={S.input} value={f.name} onChange={set('name')} placeholder="例）山田 太郎" required maxLength={60} autoComplete="name" />
                </Field>
              </div>
              <div style={S.half}>
                <Field label="フリガナ" required>
                  <input style={S.input} value={f.name_kana} onChange={set('name_kana')} placeholder="例）ヤマダ タロウ" required maxLength={60} />
                </Field>
              </div>
            </div>

            <div style={S.row}>
              <div style={S.half}>
                <Field label="生年月日" required>
                  <input style={S.input} type="date" value={f.birth_date} onChange={set('birth_date')} required max={new Date().toISOString().slice(0, 10)} />
                </Field>
              </div>
              <div style={S.half}>
                <Field label="ニックネーム">
                  <input style={S.input} value={f.nickname} onChange={set('nickname')} maxLength={40} placeholder="チームで呼ばれたい名前" />
                </Field>
              </div>
            </div>

            {isMinor && (
              <Field label="保護者の方のお名前" required hint="高校生以下の方は、保護者の方の同意が必要です。">
                <input style={S.input} value={f.guardian_name} onChange={set('guardian_name')} maxLength={60} />
              </Field>
            )}
          </div>

          <div style={S.card}>
            <h2 style={S.h2}>② 連絡先</h2>

            <Field label="ベトナムでの携帯番号" required hint="連絡のつく番号をご記入ください（例：090 1234 5678）">
              <input style={S.input} type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} required maxLength={40} autoComplete="tel" />
            </Field>

            <Field label="メールアドレス" required hint="このメールアドレスがSJFCサイトのログインIDになります。">
              <input style={S.input} type="email" inputMode="email" value={f.email} onChange={set('email')} required maxLength={120} autoComplete="email" />
            </Field>

            <Field label="ベトナムでの住所">
              <input style={S.input} value={f.address} onChange={set('address')} maxLength={200} placeholder="例）District 2, HCMC ○○マンション" />
            </Field>

            <Field label="勤務先 / 学校名">
              <input style={S.input} value={f.workplace} onChange={set('workplace')} maxLength={100} />
            </Field>

            <Field label="出身地（都道府県）">
              <input style={S.input} value={f.hometown} onChange={set('hometown')} maxLength={40} />
            </Field>
          </div>

          <div style={S.card}>
            <h2 style={S.h2}>③ 緊急連絡先（日本または配偶者）</h2>
            <div style={S.row}>
              <div style={S.half}>
                <Field label="お名前" required>
                  <input style={S.input} value={f.emergency_name} onChange={set('emergency_name')} required maxLength={60} />
                </Field>
              </div>
              <div style={S.half}>
                <Field label="続柄">
                  <input style={S.input} value={f.emergency_relation} onChange={set('emergency_relation')} maxLength={30} placeholder="例）妻、母" />
                </Field>
              </div>
            </div>
            <Field label="電話番号" required hint="国番号つきでご記入ください（例：+81-90-1234-5678）">
              <input style={S.input} type="tel" inputMode="tel" value={f.emergency_phone} onChange={set('emergency_phone')} required maxLength={80} />
            </Field>
          </div>

          <div style={S.card}>
            <h2 style={S.h2}>④ サッカーについて</h2>
            <div style={S.row}>
              <div style={S.half}>
                <Field label="第1ポジション">
                  <select style={S.input} value={f.position1} onChange={set('position1')}>
                    <option value="">選択してください</option>
                    {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
              </div>
              <div style={S.half}>
                <Field label="第2ポジション">
                  <select style={S.input} value={f.position2} onChange={set('position2')}>
                    <option value="">なし</option>
                    {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            <Field label="ユニフォームサイズ">
              <select style={S.input} value={f.uniform_size} onChange={set('uniform_size')}>
                <option value="">選択してください</option>
                {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            <div style={S.row}>
              <div style={S.half}>
                <Field label="入部時期">
                  <input style={S.input} type="month" value={f.join_period} onChange={set('join_period')} />
                </Field>
              </div>
              <div style={S.half}>
                <Field label="帰任（帰国）予定">
                  <input style={S.input} value={f.return_period} onChange={set('return_period')} maxLength={40} placeholder="例）2028年3月 / 未定" />
                </Field>
              </div>
            </div>
          </div>

          <div style={S.card}>
            <h2 style={S.h2}>⑤ 同意</h2>
            <p style={{ ...S.sub, margin: '0 0 10px' }}>
              入部案内に記載のSJFCの規則・方針を
              <a href="https://night-bird.my.canva.site/sjfc-entry" target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>こちら</a>
              でよくお読みください。
            </p>

            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.7, cursor: 'pointer' }}>
              <input type="checkbox" checked={f.consent} onChange={(e) => setF((p) => ({ ...p, consent: e.target.checked }))} style={{ marginTop: 5, width: 18, height: 18 }} />
              <span>入部案内に記載のSJFC規則・方針に賛同し、Saigon Japan Football Clubに入部を申し込みます。</span>
            </label>

            <Field label="署名（氏名を入力してください）" required>
              <input style={S.input} value={f.consent_name} onChange={set('consent_name')} maxLength={60} />
            </Field>
            <p style={S.hint}>申込日は送信時に自動で記録されます。</p>
          </div>

          {error && <div style={S.err}>{error}</div>}

          <button type="submit" style={{ ...S.btn, opacity: sending ? 0.6 : 1 }} disabled={sending}>
            {sending ? '送信中…' : 'この内容で申し込む'}
          </button>
        </form>
      </div>
    </div>
  )
}