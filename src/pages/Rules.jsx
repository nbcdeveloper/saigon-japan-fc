const Section = ({ num, title, children }) => (
  <div style={{ background: 'white', borderRadius: '10px', padding: '20px 24px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '1px', color: '#2a2220', marginBottom: '10px' }}>
      <span style={{ color: '#e8c84a' }}>{num}.</span> {title}
    </div>
    <div style={{ fontSize: '13.5px', color: '#444', lineHeight: 1.8 }}>{children}</div>
  </div>
)

const listStyle = { margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }

export default function Rules() {
  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif", maxWidth: '820px' }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '2px', color: '#2a2220', marginBottom: '4px' }}>
        規律と方針
      </div>
      <div style={{ fontSize: '12px', color: '#8a7f7a', marginBottom: '20px' }}>Rules and Policies　2026年1月1日改定</div>

      <Section num="1" title="クラブ概要">
        <p style={{ margin: 0 }}>
          正式名称：Saigon Japan Football Club（SJFC） 1998年5月発足<br />
          サイゴンジャパンフットボールクラブ
        </p>
      </Section>

      <Section num="2" title="活動目的">
        <ol style={listStyle}>
          <li>サッカーを通した健康維持、体力増強、親睦を前提にした、強くて楽しいチーム作り。</li>
          <li>日系コミュニティーへの各種支援</li>
          <li>各協賛会社の広告活動</li>
        </ol>
      </Section>

      <Section num="3" title="入部資格">
        <ol style={listStyle}>
          <li>ホーチミンでサッカーがしたい人</li>
          <li>国籍、性別、年齢、経験を問わない</li>
        </ol>
      </Section>

      <Section num="4" title="部員としての誓約事項">
        <p style={{ margin: '0 0 8px' }}>入部にあたり、以下に賛同いただきます（入部届での署名項目）。</p>
        <ol style={listStyle}>
          <li>SJFCの活動方針に賛同し、チーム運営に協力し、各種活動に積極的に参加します。</li>
          <li>SJFCの一員である自覚を持ち、各種法令を遵守します。</li>
          <li>SJFCの定められた部費を遅滞無く支払います。</li>
          <li>SJFCのホームページ内のメーリングリスト、SNSへの登録を承諾します。</li>
          <li>退部・休部の場合は速やかに連絡をします。</li>
          <li>入部届の情報に変更があった場合は速やかに連絡をします。</li>
        </ol>
      </Section>

      <Section num="5" title="入部・退部・休部の手続き">
        <p style={{ margin: '0 0 8px' }}><strong>入部</strong>：入部届の提出・署名 → 管理者が仮登録 → 発行されたアカウントでログインし、マイページからプロフィール（ポジション・生年月日・ローマ字氏名等）を入力してください。</p>
        <p style={{ margin: '0 0 8px' }}><strong>休部</strong>：チーム内幹部へ連絡してください。3ヶ月以上活動できない場合は休部扱いとします。</p>
        <p style={{ margin: 0 }}><strong>退部</strong>：速やかにチーム内幹部へご連絡ください。</p>
      </Section>

      <Section num="6" title="部費について">
        <ul style={listStyle}>
          <li>支払い区分：月額払い／都度払い（登録時に指定）</li>
          <li>金額：1,000,000VND／月</li>
          <li>支払期限：上期（1月〜6月）・下期（7月〜12月）それぞれの開始前月末までに、半年分（6,000,000VND）を一括でお支払いください。</li>
          <li>送金方法：銀行送金／現金</li>
        </ul>
      </Section>

      <Section num="7" title="練習・試合への参加について">
        <ul style={listStyle}>
          <li>アプリの「スケジュール」ページから、出欠（出席・遅刻・早退・欠席・未定）を必ず登録してください。</li>
          <li>欠席・遅刻・早退の際は、分かり次第早めに連絡・登録をお願いします。</li>
          <li>無断欠席が続いた場合：本人へ連絡のうえ、休部または除籍とする場合があります。</li>
        </ul>
      </Section>

      <Section num="8" title="活動中のマナー・行動規範">
        <ul style={listStyle}>
          <li>相手チーム・審判・仲間への敬意を持ち、フェアプレーに努めてください。</li>
          <li>暴言・暴力・過度に危険なプレーは禁止します。</li>
          <li>グラウンド・施設は時間を守って利用し、使用後の後片付け・ゴミの持ち帰りに協力してください。</li>
          <li>集合・解散時間を守り、周囲の迷惑にならないよう配慮してください。</li>
        </ul>
      </Section>

      <Section num="9" title="安全管理・怪我について">
        <ul style={listStyle}>
          <li>練習・試合前は各自ウォームアップを行い、無理のない範囲で参加してください。</li>
          <li>怪我をした場合は速やかに近くのメンバーまたは幹部に伝えてください。</li>
          <li>傷害保険はクラブとしての一括加入はありません。各自での加入をお願いします。</li>
          <li>持病・体調に不安がある場合は、事前に幹部へ共有をお願いします。</li>
        </ul>
      </Section>

      <Section num="10" title="ハラスメント防止方針">
        <p style={{ margin: 0 }}>国籍・性別・年齢・経験・所属チーム（U-40／O-40）等を理由とした差別的言動、いじめ、ハラスメントを一切認めません。</p>
      </Section>

      <Section num="11" title="情報の取り扱い・SNS利用について">
        <ul style={listStyle}>
          <li>連絡事項はホームページ内メーリングリスト・LINE・SNS等を通じて共有します（誓約事項4）。</li>
          <li>練習・試合の様子を撮影しSNS等へ投稿する場合、映っている方への配慮をお願いします（投稿NGの意思がある場合は幹部まで申し出てください）。</li>
          <li>マイページに登録した個人情報は、クラブ運営の目的以外には使用しません。</li>
        </ul>
      </Section>

      <Section num="12" title="懇親会・飲食時のマナー">
        <ul style={listStyle}>
          <li>節度を持って楽しみ、飲酒運転は絶対にしないでください（Grab等の利用を推奨）。</li>
          <li>未成年者が参加する会では、飲酒に関する配慮をお願いします。</li>
        </ul>
      </Section>

      <Section num="13" title="規律違反があった場合の対応">
        <p style={{ margin: '0 0 8px' }}>誓約事項・規律に反する行為があった場合、以下のような段階を踏んで対応します。</p>
        <ol style={listStyle}>
          <li>口頭での注意・改善のお願い</li>
          <li>幹部からの正式な警告</li>
          <li>改善が見られない場合、活動停止・除名等の措置</li>
        </ol>
      </Section>

      <Section num="14" title="お問い合わせ・相談窓口">
        <p style={{ margin: 0 }}>
          規約に関するご質問、休部・退部のご連絡、その他相談事項は下記までご連絡ください。<br />
          連絡先：芦田 大樹（SJFC代表）
        </p>
      </Section>

      <Section num="15" title="改定履歴">
        <ul style={listStyle}>
          <li>2024年10月1日：初版制定</li>
          <li>2026年1月1日：規律・方針を拡充（本改定）</li>
        </ul>
      </Section>
    </div>
  )
}
