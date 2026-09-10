import { Link } from 'react-router-dom'

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

      <div style={{ background: 'white', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: '20px' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '1px', color: '#2a2220', marginBottom: '4px' }}>SEFA 11s Fall 2026</div>
        <div style={{ fontSize: '11.5px', color: '#8a7f7a', marginBottom: '14px' }}>2026年9月18日（金）〜12月5日（土）・全12週・U-40/O-40両チーム参加</div>

        <div style={{ fontSize: '12.5px', color: '#2a2220', lineHeight: 1.8 }}>
          <div style={{ fontWeight: '700', marginBottom: '4px' }}>■ 大会概要</div>
          <div style={{ marginBottom: '10px' }}>
            12クラブが参加するリーグ戦。会場は主にPlayday・Fox Fields（予備会場：Le Football City）。キックオフは金曜20:00、土曜16:00／18:00／19:30（日曜は悪天候等の予備日）。
          </div>

          <div style={{ fontWeight: '700', marginBottom: '4px' }}>■ 大会構成（3フェーズ）</div>
          <div style={{ marginBottom: '10px' }}>
            <b>フェーズ1・ランキングステージ（第1〜7週）</b>：スイス方式で7試合。初戦は上位6チーム・下位6チームに分かれて対戦し、第2週以降は毎週の順位に応じて対戦相手が決まる。<br />
            <b>フェーズ2・グループステージ（第8〜10週）</b>：フェーズ1の順位でポット分けし、抽選で3グループ（A/B/C）に振り分け。各グループ内で3試合総当たり。<br />
            <b>フェーズ3・カップステージ（第11〜12週）</b>：全チームが準決勝に進出し、成績に応じてSerie A／B／Cカップの3段階トーナメントに振り分けられる（早期敗退なし）。
          </div>

          <div style={{ fontWeight: '700', marginBottom: '4px' }}>■ 主なルール</div>
          <div>
            ・アマチュア限定。7人制（VietFootball）・11人制（Vリーグ等）の現役プロ選手は出場不可。元プロは引退後2年以上経過していれば出場可。<br />
            ・登録人数の上限なし。参加選手は試合前に顔写真の提出が必要（アマチュア資格・本人確認のため）。<br />
            ・1選手につき1シーズン1チームまで（移籍ウィンドウ期間中の公式移籍を除く）。移籍ウィンドウは第3〜4週・第7〜8週の2回。<br />
            ・試合日程は公表後変更不可。悪天候等リーグ側都合の中止以外は再調整なし。出場できない場合は不戦敗。<br />
            ・詳細ルール・懲罰規定は開幕前に公式ハンドブックとして別途配布予定。
          </div>
        </div>
      </div>

      <Link to="/sefa" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#8a7f7a', textDecoration: 'none' }}>
        ← SEFA S11に戻る
      </Link>
    </div>
  )
}
