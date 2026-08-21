const Section = ({ num, title, children }) => (
  <div style={{ background: 'white', borderRadius: '10px', padding: '20px 24px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '1px', color: '#2a2220', marginBottom: '10px' }}>
      <span style={{ color: '#2a5fa5' }}>{num}.</span> {title}
    </div>
    <div style={{ fontSize: '13.5px', color: '#444', lineHeight: 1.8 }}>{children}</div>
  </div>
)

const listStyle = { margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }

const zoneTitleStyle = { fontWeight: '700', fontSize: '12.5px', color: '#8a7f7a', marginBottom: '5px', marginTop: '12px' }

const redLi = { color: '#e74c3c', fontWeight: '600' }

// 丸数字（①②③…）を先頭に付ける戦術リスト用スタイル
const numberedList = { ...listStyle, listStyleType: 'none', paddingLeft: '20px' }
const CIRCLED_NUMS = ['①', '②', '③', '④', '⑤', '⑥']

// スライドのピッチ図（3ゾーン＋攻守の矢印）を簡易再現
const SoccerPitchDiagram = () => (
  <svg viewBox="0 0 200 500" width="100%" style={{ maxWidth: '160px', display: 'block', margin: '0 auto' }}>
    <defs>
      <marker id="pitchArrow" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
        <path d="M0,0 L7,3.5 L0,7 Z" fill="#2a5fa5" />
      </marker>
    </defs>
    {/* ピッチ外枠 */}
    <rect x="40" y="10" width="120" height="480" fill="#fafafa" stroke="#999" strokeWidth="2" />
    {/* ゾーン区切り（破線） */}
    <line x1="40" y1="170" x2="160" y2="170" stroke="#bbb" strokeWidth="1.5" strokeDasharray="5,4" />
    <line x1="40" y1="330" x2="160" y2="330" stroke="#bbb" strokeWidth="1.5" strokeDasharray="5,4" />
    {/* ペナルティエリア（上・下） */}
    <rect x="70" y="10" width="60" height="40" fill="none" stroke="#999" strokeWidth="2" />
    <rect x="70" y="450" width="60" height="40" fill="none" stroke="#999" strokeWidth="2" />
    {/* センターサークル */}
    <circle cx="100" cy="250" r="30" fill="none" stroke="#999" strokeWidth="2" />
    <circle cx="100" cy="250" r="2.5" fill="#999" />
    {/* ゾーンラベル */}
    <text x="100" y="120" textAnchor="middle" fontSize="13" fontWeight="700" fill="#2a2220">アタッキング{'　'}サード</text>
    <text x="100" y="195" textAnchor="middle" fontSize="13" fontWeight="700" fill="#2a2220">ミドルサード</text>
    <text x="100" y="405" textAnchor="middle" fontSize="13" fontWeight="700" fill="#2a2220">ディフェンディング{'　'}サード</text>
    {/* 攻撃方向（左：上向き） */}
    <line x1="18" y1="470" x2="18" y2="24" stroke="#2a5fa5" strokeWidth="3" markerEnd="url(#pitchArrow)" />
    {/* 守備方向（右：下向き） */}
    <line x1="182" y1="24" x2="182" y2="470" stroke="#2a5fa5" strokeWidth="3" markerEnd="url(#pitchArrow)" />
  </svg>
)

export default function O40Policy() {
  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif", maxWidth: '900px' }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '2px', color: '#2a2220', marginBottom: '4px' }}>
        O-40活動方針
      </div>
      <div style={{ fontSize: '12px', color: '#8a7f7a', marginBottom: '20px' }}>SJFC OJIN TEAM 活動方針　2026-27シーズン</div>

      <Section num="1" title="OJINチーム運営体制">
        <p style={{ margin: '0 0 10px' }}>
          『健康維持、体力増強、親睦を前提にした、強くて楽しいチーム作り』に向け、全員参加でのチーム活動／運営サポートにご協力をお願いします。
        </p>
        <p style={{ margin: '0 0 6px', fontWeight: '700' }}>＜ご協力頂きたいチーム活動／運営サポート（一例）＞</p>
        <ul style={listStyle}>
          <li>毎回の練習、試合への出欠アンケート回答</li>
          <li>集合時間を守る、いい準備をする</li>
          <li>練習＆試合活動への参加（試合中に声を出す、感じたことをコメントする、タイムキーパー）</li>
          <li>個人個人でのトレーニング（体力づくり、筋トレなど）</li>
          <li>練習、試合でのボールや救急バック等のチーム備品の運搬（わかなに取りに行く、置きに行く）</li>
          <li>スクイズボトル、氷嚢の管理、試合での持参と試合中のサポート</li>
          <li>新規部員の勧誘（行きつけのお店、BARにSJFCのポスターを貼る）</li>
          <li>チームイベントへの参加、若手メンバーとの親睦　など</li>
        </ul>
      </Section>

      <Section num="2" title="活動方針">
        <p style={{ margin: '0 0 4px', fontWeight: '700' }}>活動方針①：真剣に、戦う集団。</p>
        <ul style={{ ...listStyle, marginBottom: '14px' }}>
          <li>サッカーに真剣に取り組む！サッカーを楽しむためには真剣に、本気で取り組む！</li>
          <li>目の前の相手に負けない。局面での勝負にこだわる。取られたら、取り返す。さぼらない。</li>
        </ul>
        <p style={{ margin: '0 0 4px', fontWeight: '700' }}>活動方針②：勝負にこだわる。</p>
        <ul style={{ ...listStyle, marginBottom: '14px' }}>
          <li>勝ちきるチーム、勝ちきれるチーム！常に、レギュラーを争う！</li>
          <li>その準備を怠らない、そのマインドをもって、行動する。</li>
        </ul>
        <p style={{ margin: '0 0 4px', fontWeight: '700' }}>活動方針③：本気で楽しむ。</p>
        <ul style={listStyle}>
          <li>ホーチミンで出会った最高の仲間とクリエイティブなサッカーを！遊び心も！</li>
          <li>サッカーができる環境、スポンサーへの感謝、家族への感謝を忘れない！</li>
        </ul>
      </Section>

      <Section num="3" title="活動目標">
        <p style={{ margin: '0 0 4px', fontWeight: '700' }}>活動目標①：リーグ戦優勝</p>
        <ul style={{ ...listStyle, marginBottom: '14px' }}>
          <li>チーム戦術の実践環境。優勝を目指し、勝利にこだわる！</li>
        </ul>
        <p style={{ margin: '0 0 4px', fontWeight: '700' }}>活動目標②：OJIN CUP優勝</p>
        <ul style={{ ...listStyle, marginBottom: '14px' }}>
          <li>年に一度のイベントを参加メンバー全員で楽しみ、優勝を目指す。（全員参加で4強入）</li>
        </ul>
        <p style={{ margin: '0 0 4px', fontWeight: '700' }}>活動目標③：毎週試合開催</p>
        <ul style={{ ...listStyle, marginBottom: '14px' }}>
          <li>毎週（基本、日曜日）、試合を組み、チーム戦術の共有と実践。レギュラー争いの場。出場時間に差あり。</li>
        </ul>
        <p style={{ margin: '0 0 4px', fontWeight: '700' }}>活動目標④：強度を意識した練習の実践</p>
        <ul style={{ ...listStyle, marginBottom: '14px' }}>
          <li>リーグ戦、OJIN CUP、練習試合で戦うための準備の場（強度へのこだわり）。レギュラー争いの場。</li>
        </ul>
        <p style={{ margin: '0 0 4px', fontWeight: '700' }}>活動目標⑤：定期的なイベント開催</p>
        <ul style={listStyle}>
          <li>南北戦、他国との交流試合を組み、チーム戦術の実践環境を整える</li>
          <li>ミニOJIN CUP、懇親会、歓迎会、送別会、ゴルフコンペ、オジリンピック、家族BBQなど</li>
        </ul>
      </Section>

      <Section num="4" title="チーム戦術（目指すサッカー）">
        <div className="o40-tactics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 160px 1fr', gap: '20px', alignItems: 'start' }}>
          {/* 攻撃 */}
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', letterSpacing: '1px', color: '#e74c3c', borderBottom: '2px solid #e74c3c', paddingBottom: '4px', marginBottom: '4px' }}>攻撃</div>

            <div style={zoneTitleStyle}>アタッキングサード</div>
            <ol style={numberedList}>
              <li>{CIRCLED_NUMS[0]}アタッキングサードでは自由</li>
              <li>{CIRCLED_NUMS[1]}アイデア持っている人がシュート、ドリブル、パスで仕掛ける</li>
              <li style={redLi}>{CIRCLED_NUMS[2]}サイドからアーリークロスを狙う</li>
            </ol>

            <div style={zoneTitleStyle}>ミドルサード</div>
            <ol style={numberedList}>
              <li style={redLi}>{CIRCLED_NUMS[0]}スイッチに連動し、FWの裏のスペース、MFの裏のスペース（両サイドのポケット）を狙う</li>
              <li style={redLi}>{CIRCLED_NUMS[1]}展開につまったら、サイドチェンジ</li>
              <li style={redLi}>{CIRCLED_NUMS[2]}同じレーンに入らない</li>
            </ol>

            <div style={zoneTitleStyle}>ディフェンディングサード</div>
            <ol style={numberedList}>
              <li style={redLi}>{CIRCLED_NUMS[0]}セーフティにボールをつなぎ、ビルドアップ（前に急がない）</li>
              <li>{CIRCLED_NUMS[1]}サイドチェンジはパススピード。可能なら1つ飛ばす展開。</li>
              <li style={redLi}>{CIRCLED_NUMS[2]}前線を見る、FW、MFを狙い、グラウンダーでフィード。前線に入ったらスイッチ、3人目の動き。</li>
            </ol>
          </div>

          {/* ピッチ図 */}
          <div className="o40-pitch-col" style={{ position: 'sticky', top: '90px' }}>
            <SoccerPitchDiagram />
          </div>

          {/* 守備 */}
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', letterSpacing: '1px', color: '#2a5fa5', borderBottom: '2px solid #2a5fa5', paddingBottom: '4px', marginBottom: '4px' }}>守備</div>

            <div style={zoneTitleStyle}>アタッキングサード（前線からの守備）</div>
            <ol style={numberedList}>
              <li style={redLi}>
                {CIRCLED_NUMS[0]}最前線からボールホルダーへロックする
                <ul style={{ margin: '4px 0 0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <li style={redLi}>サイドに追い込む縦切りでプレス</li>
                  <li style={redLi}>サイドに追い込んだら、横切り</li>
                </ul>
              </li>
              <li style={redLi}>{CIRCLED_NUMS[1]}全員でプレスし、サイド、ボランチに出たところを奪う</li>
            </ol>

            <div style={zoneTitleStyle}>ミドルサード</div>
            <ol style={numberedList}>
              <li style={redLi}>{CIRCLED_NUMS[0]}後ろからの声出し、局面で負けない</li>
              <li>{CIRCLED_NUMS[1]}センターサークルあたりから、侵入してきた相手に対し、ロック⇒プレス</li>
              <li>{CIRCLED_NUMS[2]}ボールと相手の状況に合わせ、チャレンジ＆チャレンジする（取りどき）</li>
            </ol>

            <div style={zoneTitleStyle}>ディフェンディングサード</div>
            <ol style={numberedList}>
              <li>{CIRCLED_NUMS[0]}マンマークとゾーン</li>
              <li>{CIRCLED_NUMS[1]}体を張って抜かれない（球際での勝負）</li>
              <li>{CIRCLED_NUMS[2]}最後まであきらめない（気持ちと勝負）</li>
            </ol>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .o40-tactics-grid { grid-template-columns: 1fr !important; }
            .o40-pitch-col { position: static !important; order: -1; margin-bottom: 8px; }
          }
        `}</style>
      </Section>
    </div>
  )
}
