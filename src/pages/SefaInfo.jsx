import { Link } from 'react-router-dom'

const cardStyle = {
  background: 'white',
  borderRadius: '10px',
  padding: '18px 22px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
  marginBottom: '16px',
}

const sectionTitleStyle = {
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: '17px',
  letterSpacing: '1px',
  color: '#2a2220',
  marginBottom: '10px',
}

const bodyTextStyle = {
  fontSize: '12.5px',
  color: '#2a2220',
  lineHeight: 1.9,
}

const subLabelStyle = {
  fontWeight: '700',
  marginBottom: '2px',
}

export default function SefaInfo() {
  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
      <Link to="/sefa" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#8a7f7a', textDecoration: 'none', marginBottom: '16px' }}>
        ← SEFA S11に戻る
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <img src="/sefa-logo.png" alt="SEFA S11" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '2px', color: '#2a2220' }}>大会概要・ルール</div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '1px', color: '#2a2220', marginBottom: '4px' }}>SEFA 11s Autumn 2026 公式ハンドブック</div>
        <div style={{ fontSize: '11.5px', color: '#8a7f7a' }}>2026年9月18日（金）〜12月5日（土）・全12週</div>
      </div>

      {/* 1. 試合当日ルール */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>■ 1. 試合当日ルール</div>
        <div style={bodyTextStyle}>
          ・試合時間：前後半40分ずつ（ハーフタイム5分）<br />
          ・出場登録人数：1試合あたり最大22名。全選手は事前登録が必要<br />
          ・交代：ハーフタイムでの交代を含め、1試合最大5回まで（1回の交代における人数自体に制限はなし）<br />
          ・試合開始の猶予：キックオフ予定時刻から最大20分遅れまで。この時点で最低8名揃っていれば試合を開始する義務がある<br />
          ・不戦敗：30分経過しても試合を開始できない場合、相手チームに3-0の勝利が与えられ、その試合の費用は不戦敗となったチームが全額負担する<br />
          ・VAR：全試合で導入。各チーム前半・後半それぞれ1回、1試合あたり最大2回まで要求可能。対象は直接レッドカードまたはゴール判定に関する事象に限る。要求できるのはキャプテンとチームマネージャーのみ<br />
          ・スパイク（サッカーシューズ）：使用に関する制限なし<br />
          ・すね当て：ケガ防止のため着用を強く推奨
        </div>
      </div>

      {/* 2. リーグ形式・構成 */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>■ 2. リーグ形式・構成</div>
        <div style={bodyTextStyle}>
          ・参加12チーム：本格的に組織された11人制クラブ12チーム<br />
          ・開催期間：2026年9月18日（金）〜12月5日（土）、全12週<br /><br />

          <div style={subLabelStyle}>フェーズ1：ランキングステージ（第1〜7週）</div>
          ・形式：スイス方式（1チームあたり7試合）<br />
          ・第1週の組み合わせ：ランダム生成（ただし同一チーム同士の対戦は回避）<br />
          ・第2〜7週の組み合わせ：その時点の順位・成績に応じて動的に生成。毎週、成績の近いチーム同士が対戦する仕組みで、バランスの取れた予測しづらい対戦が続く<br /><br />

          <div style={subLabelStyle}>フェーズ2：グループステージ（第8〜10週）</div>
          ・フェーズ1終了後、公式ドロー（抽選会）で4チームずつ3グループ（A・B・C）に分割<br />
          ・ポット分けはフェーズ1最終順位に基づく：ポット1＝1〜3位／ポット2＝4〜6位／ポット3＝7〜9位／ポット4＝10〜12位<br />
          ・各グループには各ポットから1チームずつ配置される<br />
          ・各チームは同グループ内の3チームと対戦（グループステージ3試合）<br /><br />

          <div style={subLabelStyle}>フェーズ3：ティアード・カップステージ（第11〜12週）</div>
          ・早期敗退なし。全クラブが準決勝に進出し、フェーズ2グループステージの成績に応じた3段階のノックアウトトーナメントで優勝を争う<br />
          ・🏆 Serie Aカップ：各グループ優勝3チーム＋ベスト2位1チーム<br />
          ・🥈 Serie Bカップ：2位チームのうち2番目・3番目に成績の良い2チーム＋3位チームのうち上位2チーム<br />
          ・🥉 Serie Cカップ：3位チームのうち3番目に成績の良い1チーム＋4位チーム3チーム
        </div>
      </div>

      {/* 3. 出場資格 */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>■ 3. 出場資格</div>
        <div style={bodyTextStyle}>
          <div style={subLabelStyle}>完全アマチュア規定</div>
          ・アマチュア選手限定。現役プロ選手（Vリーグ、Vリーグ2、その他プロリーグ所属）は出場不可<br />
          ・元プロ選手は、引退後2年間連続して無所属である場合に限り出場可能<br /><br />

          <div style={subLabelStyle}>登録選手リスト</div>
          ・第1節開始前に、選手写真付きの登録リストを提出（テンプレートはリーグのZaloグループで共有予定）<br />
          ・フェーズ1（第1〜7週）期間中は、フルメンバーを確保しやすいよう登録人数の上限を設けない<br />
          ・登録リストには出場全選手の鮮明な顔写真を添付すること<br />
          ・試合当日に新規選手を起用する場合は事前にリーグへ連絡し、写真は試合後24時間以内に提出する<br />
          ・グループステージ開始（第8週）前に、残り5試合分として最大30名の最終登録リストを提出。以降の追加・変更は不可<br /><br />

          <div style={subLabelStyle}>1チーム専属制</div>
          ・1選手は1シーズンにつき1チームのみ所属可能（公式の移籍ウィンドウでの移籍を除く）<br /><br />

          <div style={subLabelStyle}>移籍ウィンドウ（年2回）</div>
          ・ウィンドウ1：第3週〜第4週の間<br />
          ・ウィンドウ2：第7週〜第8週の間（グループステージ開始前）<br /><br />

          <div style={subLabelStyle}>日程・再調整</div>
          ・公表された試合日程は固定で変更不可<br />
          ・再調整（リスケジュール）は、悪天候や施設の停電など不可抗力によりリーグ運営側が中止を決定した場合のみ認められる<br />
          ・チームが試合を消化できない場合は自動的に不戦敗となる
        </div>
      </div>

      {/* 4. 規律・懲罰 */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>■ 4. 規律・懲罰</div>
        <div style={bodyTextStyle}>
          ・カード罰金：イエローカード10万VND、直接レッドカード30万VND<br /><br />

          <div style={subLabelStyle}>イエローカード</div>
          ・フェーズ1：累積3枚で1試合出場停止、6枚で2試合出場停止。累積数はランキングステージ終了後にリセットされるが、レッドカードによる出場停止処分は次フェーズに持ち越される<br />
          ・フェーズ2：グループステージ第1・第2試合累積2枚で1試合出場停止。累積数はグループステージ終了後にリセットされるが、レッドカードによる出場停止処分は次フェーズに持ち越される<br /><br />

          <div style={subLabelStyle}>レッドカード</div>
          ・暴力行為・重大な反則行為による一発レッドカードは、最低2試合の出場停止
        </div>
      </div>

      {/* 5. 費用 */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>■ 5. 費用</div>
        <div style={bodyTextStyle}>
          ・試合当日費用：Playday・Le Footballでの試合は1チームあたり230万VND（ピッチ使用料、SEFA承認レフェリー3名分、ライブ配信・写真撮影費用を含む）<br />
          ・支払い方法：試合後にピッチ会場へ直接支払う<br />
          ・登録費：1チーム100万VND<br />
          ・カードデポジット：1チーム100万VND（試合後に返金）
        </div>
      </div>

      {/* 6. 再調整（リスケジュール） */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>■ 6. 再調整（リスケジュール）</div>
        <div style={bodyTextStyle}>
          ・悪天候・停電など、ピッチが使用不可と判断された場合を除き、再調整は認められない<br />
          ・チームが試合を消化できない場合は不戦敗となり、相手チームに自動的に3-0の勝利が与えられる<br />
          ・ランキングステージまたはグループステージ中に再調整となった試合で、いずれかのチームが消化できない場合は0-0の引き分けとして記録される<br />
          ・カップステージ中に再調整となった場合、その試合は必ず開催しなければならず、開催できない場合は両チームとも大会失格となる
        </div>
      </div>

      {/* 7. 会場 */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>■ 7. 会場</div>
        <div style={bodyTextStyle}>
          ・Le Football：<a href="https://maps.app.goo.gl/YE5xne6zadcHP5DTA" target="_blank" rel="noopener noreferrer" style={{ color: '#2a5fa5' }}>Googleマップで見る</a><br />
          ・Playday：<a href="https://maps.app.goo.gl/ThxjTCTbaADrLKGe8" target="_blank" rel="noopener noreferrer" style={{ color: '#2a5fa5' }}>Googleマップで見る</a>
        </div>
      </div>

      {/* 8. 苦情・フィードバック */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>■ 8. 苦情・フィードバック</div>
        <div style={bodyTextStyle}>
          ・苦情・フィードバックは、リーグの主催者であるDuc Nguyen氏まで直接お寄せください<br />
          ・寄せられた情報のうち関連するものはグループ全体で共有し、メインの連絡チャンネルを全員にとって有用な状態に保ちます
        </div>
      </div>

      <Link to="/sefa" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#8a7f7a', textDecoration: 'none' }}>
        ← SEFA S11に戻る
      </Link>
    </div>
  )
}
