const Section = ({ num, title, children }) => (
  <div style={{ background: 'white', borderRadius: '10px', padding: '20px 24px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '1px', color: '#2a2220', marginBottom: '10px' }}>
      <span style={{ color: '#7b5ea7' }}>{num}.</span> {title}
    </div>
    <div style={{ fontSize: '13.5px', color: '#444', lineHeight: 1.8 }}>{children}</div>
  </div>
)

const listStyle = { margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }

export default function U40Policy() {
  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif", maxWidth: '900px' }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '2px', color: '#2a2220', marginBottom: '4px' }}>
        U-40活動方針
      </div>
      <div style={{ fontSize: '12px', color: '#8a7f7a', marginBottom: '20px' }}>SJFC U-40 TEAM 活動方針　2026-27シーズン</div>

      <Section num="1" title="チーム運営体制">
        <p style={{ margin: '0 0 12px', fontWeight: '700', color: '#2a2220', fontStyle: 'italic' }}>
          『勝利にこだわりながら、全員が主体的にチームを作り、サッカーも駐在生活も本気で楽しめる集団へ』
        </p>
        <p style={{ margin: '0 0 10px' }}>
          U40をより強く楽しいチームにする為、全員が主体者として、チーム活動・運営への積極的な参加／サポートをお願いします。
        </p>
        <p style={{ margin: '0 0 6px', fontWeight: '700' }}>＜ご協力いただきたいチーム活動／運営サポート（一例）＞</p>
        <ul style={{ ...listStyle, marginBottom: '10px' }}>
          <li>毎回の練習/試合への出欠アンケート回答、積極的な参加</li>
          <li>ボール、水、救急バッグ等のチーム備品の運搬・管理</li>
          <li>練習/試合の準備、片付け、タイムキーパー等への協力</li>
          <li>積極的な意見の発信、チームへの主体的な貢献、関わり</li>
          <li>新規メンバーの勧誘・受け入れ</li>
          <li>OJINチーム含む世代間交流</li>
          <li>歓迎会、送別会、親睦会等のチームイベントへの積極的な参加</li>
        </ul>
        <p style={{ margin: 0 }}>幹部、運営メンバーだけでなく、全員で、より良いチームを目指していきましょう。</p>
      </Section>

      <Section num="2" title="活動方針">
        <p style={{ margin: '0 0 4px', fontWeight: '700' }}>①勝利にこだわる。</p>
        <ul style={{ ...listStyle, marginBottom: '14px' }}>
          <li>試合に出る以上、勝つことを目指す。得点、失点、結果に拘る。</li>
          <li>チームの為に、走る、体を張る、球際で負けない、声を出す。</li>
          <li>勝つためにできることを、ピッチ内外のメンバー全員が考え、体現する。</li>
        </ul>
        <p style={{ margin: '0 0 4px', fontWeight: '700' }}>②全員でチームを作る。</p>
        <ul style={{ ...listStyle, marginBottom: '14px' }}>
          <li>一人一人がU40の当事者。</li>
          <li>練習、試合、準備、片付け、声掛け、チーム運営まで、決して他人任せにせず、一人一人で考え、意見を出し合い、実践する。</li>
          <li>『このチームの為なら』と心から思えるチームを、全員で作る。</li>
        </ul>
        <p style={{ margin: '0 0 4px', fontWeight: '700' }}>③本気で楽しみ、周囲への感謝を忘れない。</p>
        <ul style={listStyle}>
          <li>真剣にやるからこそ、サッカーは楽しい。</li>
          <li>勝った喜び、負けた悔しさも含めて、みんなで共有できるチームにする。</li>
          <li>サッカーができる環境、スポンサー、家族、対戦相手、チームメイトへの感謝を忘れない。</li>
        </ul>
      </Section>

      <Section num="3" title="活動目標">
        <p style={{ margin: '0 0 4px', fontWeight: '700' }}>①J Asia優勝</p>
        <ul style={{ ...listStyle, marginBottom: '14px' }}>
          <li>年間を通じたチーム最大の目標。大会数か月前からはJ Asiaに特化した練習、戦術の実践。チーム全体で共通認識を醸成し、優勝を目指す。</li>
        </ul>
        <p style={{ margin: '0 0 4px', fontWeight: '700' }}>②リーグ戦優勝</p>
        <ul style={{ ...listStyle, marginBottom: '14px' }}>
          <li>唯一の日本人チームとして存在感を発揮し、ベトナム人、外国人チームに負けない。参加できるメンバー全員で優勝を目指す。</li>
        </ul>
        <p style={{ margin: '0 0 4px', fontWeight: '700' }}>③定期的な練習・試合環境の確保</p>
        <ul style={{ ...listStyle, marginBottom: '14px' }}>
          <li>幹部、運営メンバー中心に、継続的にサッカーができる環境を作る。</li>
        </ul>
        <p style={{ margin: '0 0 4px', fontWeight: '700' }}>④ピッチ外の定期イベント</p>
        <ul style={listStyle}>
          <li>メンバーの歓送迎会、日々の飲み会、ゴルフ、BBQ、家族イベント等を通じて、メンバー同士の交流を深める。</li>
        </ul>
      </Section>
    </div>
  )
}
